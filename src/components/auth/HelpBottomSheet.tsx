import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';

interface HelpBottomSheetProps {
  visible: boolean;
  onClose: () => void;
}

const HELP_OPTIONS = [
  {
    id: 'password',
    title: 'Mot de passe oublié',
    description: 'Je ne me souviens plus de mon mot de passe',
    icon: 'lock-closed-outline',
  },
  {
    id: 'account',
    title: 'Impossible de créer un compte',
    description: 'J\'ai des difficultés à créer mon compte',
    icon: 'person-add-outline',
  },
  {
    id: 'login',
    title: 'Problème de connexion',
    description: 'Je n\'arrive pas à me connecter',
    icon: 'log-in-outline',
  },
  {
    id: 'email',
    title: 'Email non reçu',
    description: 'Je n\'ai pas reçu l\'email de vérification',
    icon: 'mail-outline',
  },
  {
    id: 'other',
    title: 'Autre',
    description: 'Autre problème non listé',
    icon: 'help-circle-outline',
  },
];

const HelpBottomSheet: React.FC<HelpBottomSheetProps> = ({ visible, onClose }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; message?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
    setErrors({});
  };

  const handleSend = async () => {
    // Validation
    const newErrors: { email?: string; message?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Veuillez entrer votre email';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Veuillez entrer un email valide';
    }

    if (selectedOption === 'other' && !customMessage.trim()) {
      newErrors.message = 'Veuillez décrire votre problème';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const selectedOptionData = HELP_OPTIONS.find(opt => opt.id === selectedOption);
      const issueDescription = selectedOption === 'other' 
        ? customMessage 
        : selectedOptionData?.description || '';

      // Préparer le contenu de l'email
      const emailBody = `
Type de problème: ${selectedOptionData?.title || 'Autre'}
Description: ${issueDescription}

Email de contact: ${email}

---
Cette demande a été envoyée depuis l'application mobile LaSo Coach.
      `.trim();

      const emailSubject = encodeURIComponent(`Demande d'aide - ${selectedOptionData?.title || 'Autre'}`);
      const emailBodyEncoded = encodeURIComponent(emailBody);
      const mailtoUrl = `mailto:support@lasocoach.com?subject=${emailSubject}&body=${emailBodyEncoded}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Votre application email va s\'ouvrir',
          visibilityTime: 3000,
        });
        // Reset form after a short delay
        setTimeout(() => {
          setSelectedOption(null);
          setEmail('');
          setCustomMessage('');
          setErrors({});
          onClose();
        }, 1000);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir l\'application email. Veuillez envoyer votre demande à support@lasocoach.com',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue. Veuillez réessayer.',
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setEmail('');
    setCustomMessage('');
    setErrors({});
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={[styles.container, { paddingBottom: Platform.OS === 'ios' ? 0 : 20 }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Besoin d'aide ?</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.contentContainer}
            >
                {!selectedOption ? (
                  <>
                    <Text style={styles.subtitle}>
                      Sélectionnez le problème que vous rencontrez :
                    </Text>
                    {HELP_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.id}
                        style={styles.optionCard}
                        onPress={() => handleOptionSelect(option.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionIconContainer}>
                          <Ionicons 
                            name={option.icon as any} 
                            size={24} 
                            color={theme.colors.primary} 
                          />
                        </View>
                        <View style={styles.optionContent}>
                          <Text style={styles.optionTitle}>{option.title}</Text>
                          <Text style={styles.optionDescription}>{option.description}</Text>
                        </View>
                        <Ionicons 
                          name="chevron-forward" 
                          size={20} 
                          color={theme.colors.text.secondary} 
                        />
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  <>
                    <View style={styles.backButtonContainer}>
                      <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                          setSelectedOption(null);
                          setCustomMessage('');
                          setErrors({});
                        }}
                      >
                        <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                        <Text style={styles.backButtonText}>Retour</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                      {selectedOption === 'other' 
                        ? 'Décrivez votre problème :'
                        : 'Entrez votre email pour recevoir de l\'aide :'}
                    </Text>

                    {/* Email Input */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Email *</Text>
                      <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        placeholder="votre@email.com"
                        placeholderTextColor={theme.colors.text.secondary}
                        value={email}
                        onChangeText={(text) => {
                          setEmail(text);
                          if (errors.email) {
                            setErrors({ ...errors, email: undefined });
                          }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {errors.email && (
                        <Text style={styles.errorText}>{errors.email}</Text>
                      )}
                    </View>

                    {/* Custom Message Input (for "other" option) */}
                    {selectedOption === 'other' && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.label}>Description du problème *</Text>
                        <TextInput
                          style={[
                            styles.textArea,
                            errors.message && styles.inputError
                          ]}
                          placeholder="Décrivez votre problème en détail..."
                          placeholderTextColor={theme.colors.text.secondary}
                          value={customMessage}
                          onChangeText={(text) => {
                            setCustomMessage(text);
                            if (errors.message) {
                              setErrors({ ...errors, message: undefined });
                            }
                          }}
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                        />
                        {errors.message && (
                          <Text style={styles.errorText}>{errors.message}</Text>
                        )}
                      </View>
                    )}

                    {/* Send Button */}
                    <TouchableOpacity
                      style={[styles.sendButton, loading && styles.sendButtonDisabled]}
                      onPress={handleSend}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="send" size={20} color="#FFFFFF" />
                          <Text style={styles.sendButtonText}>Envoyer</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 650,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginBottom: 20,
    fontWeight: '500',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  optionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  backButtonContainer: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: 20,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default HelpBottomSheet;

