import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';
import Toast from 'react-native-toast-message';
import { reviewEligibilityService } from '../services/review/reviewEligibilityService';

interface ContactSupportScreenProps {
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
  user?: any;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

type RequestType = 'bug' | 'technical' | 'inappropriate' | 'delete_account';

const ContactSupportScreen: React.FC<ContactSupportScreenProps> = ({
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
  user,
  showBackButton = false,
  onBackPress,
}) => {
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestTypes: { id: RequestType; label: string; icon: string }[] = [
    { id: 'bug', label: 'Signaler un bug', icon: 'bug-outline' },
    { id: 'technical', label: 'Problème technique', icon: 'construct-outline' },
    { id: 'inappropriate', label: 'Contenu inapproprié', icon: 'warning-outline' },
    { id: 'delete_account', label: 'Demande de suppression de compte', icon: 'trash-outline' },
  ];

  const handleRequestTypeSelect = (type: RequestType) => {
    setRequestType(type);
    // Pré-remplir le sujet selon le type
    const subjects: Record<RequestType, string> = {
      bug: 'Signalement de bug',
      technical: 'Problème technique',
      inappropriate: 'Contenu inapproprié',
      delete_account: 'Demande de suppression de compte',
    };
    setSubject(subjects[type]);
  };

  const handleSubmit = async () => {
    if (!requestType) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez sélectionner un type de demande',
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez remplir tous les champs',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Préparer le contenu de l'email
      const emailBody = `
Type de demande: ${requestTypes.find(t => t.id === requestType)?.label}
Sujet: ${subject}

Message:
${message}

---
Informations utilisateur:
Email: ${user?.email || 'Non disponible'}
Nom: ${user?.firstName || ''} ${user?.lastName || ''}
ID: ${user?.id || 'Non disponible'}
      `.trim();

      const emailSubject = encodeURIComponent(subject);
      const emailBodyEncoded = encodeURIComponent(emailBody);
      const mailtoUrl = `mailto:support@lasocoach.com?subject=${emailSubject}&body=${emailBodyEncoded}`;

      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        void reviewEligibilityService.blockAfterComplaintFlow();
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: 'Votre application email va s\'ouvrir',
        });
        // Réinitialiser le formulaire après un court délai
        setTimeout(() => {
          setRequestType(null);
          setSubject('');
          setMessage('');
        }, 1000);
      } else {
        Alert.alert(
          'Erreur',
          'Impossible d\'ouvrir l\'application email. Veuillez envoyer votre demande à support@lasocoach.com',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Une erreur est survenue',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmail = () => {
    Linking.openURL('mailto:support@lasocoach.com');
  };

  return (
    <FixedLayout
      headerTitle="Contact Support"
      activeTab={activeTab}
      onTabPress={onTabPress}
      onHelpPress={() => {}}
      onNotificationPress={() => {}}
      onProfilePress={() => {}}
      avatarSource={avatarSource}
      avatarFallbackText={avatarFallbackText}
      showBackButton={showBackButton}
      onBackPress={onBackPress}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type de demande</Text>
          <View style={styles.requestTypesContainer}>
            {requestTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.requestTypeCard,
                  requestType === type.id && styles.requestTypeCardSelected,
                ]}
                onPress={() => handleRequestTypeSelect(type.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={type.icon as any}
                  size={24}
                  color={requestType === type.id ? theme.colors.primary : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.requestTypeLabel,
                    requestType === type.id && styles.requestTypeLabelSelected,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sujet *</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Entrez le sujet de votre demande"
            placeholderTextColor={theme.colors.text.secondary}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={message}
            onChangeText={setMessage}
            placeholder="Décrivez votre demande en détail..."
            placeholderTextColor={theme.colors.text.secondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Envoi...' : 'Envoyer la demande'}
          </Text>
        </TouchableOpacity>

        <View style={styles.emailSection}>
          <Text style={styles.emailSectionTitle}>Ou contactez-nous directement</Text>
          <TouchableOpacity style={styles.emailButton} onPress={handleOpenEmail}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.emailButtonText}>support@lasocoach.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </FixedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  requestTypesContainer: {
    gap: 12,
  },
  requestTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  requestTypeCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight + '20',
  },
  requestTypeLabel: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  requestTypeLabelSelected: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emailSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  emailSectionTitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  emailButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default ContactSupportScreen;

