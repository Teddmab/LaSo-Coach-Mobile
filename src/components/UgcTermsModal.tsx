import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { theme } from '../constants/theme';

interface UgcTermsModalProps {
  visible: boolean;
  onAccept: () => Promise<void>;
  onDecline: () => void;
  onViewTerms?: () => void;
}

/**
 * UgcTermsModal - Zero-tolerance UGC policy modal
 * 
 * Displays App Store compliance requirements for user-generated content (chat/community).
 * Users must accept terms before accessing chat/community features.
 * 
 * Phase 7 - TODO #1: Verify modal styling matches design system
 * Phase 7 - TODO #2: Add animations for modal appearance
 */
const UgcTermsModal: React.FC<UgcTermsModalProps> = ({
  visible,
  onAccept,
  onDecline,
  onViewTerms,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      console.log('🎯 [UgcTermsModal] User accepting UGC terms...');
      await onAccept();
      console.log('✅ [UgcTermsModal] UGC terms acceptance tracked');
    } catch (error) {
      console.error('❌ [UgcTermsModal] Error accepting terms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecline = () => {
    console.log('🎯 [UgcTermsModal] User declining UGC terms');
    onDecline();
  };

  const handleViewTerms = async () => {
    console.log('🎯 [UgcTermsModal] User viewing full terms');
    if (onViewTerms) {
      onViewTerms();
    } else {
      // Fallback: Open external URL
      try {
        await Linking.openURL('https://lasocoach.com/termes-de-service/');
      } catch (error) {
        console.error('❌ [UgcTermsModal] Error opening terms URL:', error);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>L'Agora - Règles de la Communauté</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.contentContainer}
          >
            <View style={styles.section}>
              <Text style={styles.introText}>
                L'Agora est un espace d'échange respectueux. En cliquant sur accepter, vous acceptez nos conditions d'utilisation, y compris le respect des règles de la plateforme et de la communauté :
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>❌ Contenu Interdit</Text>
              <Text style={styles.sectionText}>
                Le contenu suivant est strictement interdit et sera supprimé immédiatement :
              </Text>
              <View style={styles.bulletList}>
                <Text style={styles.bullet}>• Discours de haine ou discrimination</Text>
                <Text style={styles.bullet}>• Violence ou menaces de violence</Text>
                <Text style={styles.bullet}>• Contenu sexuel ou explicite</Text>
                <Text style={styles.bullet}>• Harcèlement ou intimidation</Text>
                <Text style={styles.bullet}>• Spam ou informations trompeuses</Text>
                <Text style={styles.bullet}>• Conseils médicaux non professionnels</Text>
                <Text style={styles.bullet}>• Violations de droits d'auteur</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Modération</Text>
              <Text style={styles.sectionText}>
                Tout contenu généré par l'utilisateur est sujet à révision et modération. Nous pouvons supprimer le contenu qui viole ces règles. Les violations répétées peuvent entraîner la suspension ou la suppression du compte.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Signalement</Text>
              <Text style={styles.sectionText}>
                Si vous rencontrez du contenu qui viole ces règles, veuillez utiliser la fonction de signalement disponible sur chaque message ou publication. Notre équipe de modération examinera tous les signalements.
              </Text>
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={handleViewTerms}>
                <Text style={styles.termsLink}>
                  📖 Lire nos termes & règles de la plateforme complets
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer with Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={isLoading}
            >
              <Text style={styles.declineButtonText}>Je Refuse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.acceptButtonText}>J'Accepte & Continuer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.primary,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
  },
  bulletList: {
    marginTop: 8,
    marginLeft: 4,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  acceptButton: {
    backgroundColor: theme.colors.primary,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default UgcTermsModal;
