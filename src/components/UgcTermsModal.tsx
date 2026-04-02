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
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
 */
const UgcTermsModal: React.FC<UgcTermsModalProps> = ({
  visible,
  onAccept,
  onDecline,
  onViewTerms,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

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

  const handleViewTerms = () => {
    console.log('🎯 [UgcTermsModal] User viewing full terms - opening popup');
    setShowTermsPopup(true);
  };

  const handleCloseTermsPopup = () => {
    setShowTermsPopup(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDecline}
    >
      <View style={styles.overlay}>
        <BlurView
          intensity={20}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.container, { maxHeight: screenHeight * 0.9, paddingBottom: insets.bottom }]}>
          {/* Handle bar for bottom sheet */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header with icon */}
          <View style={styles.header}>
            <View style={styles.headerIconContainer}>
              <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Règles de la Communauté</Text>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.contentContainer}
            nestedScrollEnabled={true}
          >
            <View style={styles.section}>
              <View style={styles.introCard}>
              <Text style={styles.introText}>
                L'Agora est un espace d'échange respectueux. En cliquant sur accepter, vous acceptez nos conditions d'utilisation, y compris le respect des règles de la plateforme et de la communauté :
              </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="close-circle" size={24} color="#F44336" />
                  <Text style={styles.sectionTitle}>Contenu Interdit</Text>
                </View>
              <Text style={styles.sectionText}>
                Le contenu suivant est strictement interdit et sera supprimé immédiatement :
              </Text>
              <View style={styles.bulletList}>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Discours de haine ou discrimination</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Violence ou menaces de violence</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Contenu sexuel ou explicite</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Harcèlement ou intimidation</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Spam ou informations trompeuses</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Conseils médicaux non professionnels</Text>
                  </View>
                  <View style={styles.bulletItem}>
                    <Ionicons name="remove-circle" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.bullet}>Violations de droits d'auteur</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text" size={24} color={theme.colors.primary} />
                  <Text style={styles.sectionTitle}>Modération</Text>
                </View>
              <Text style={styles.sectionText}>
                Tout contenu généré par l'utilisateur est sujet à révision et modération. Nous pouvons supprimer le contenu qui viole ces règles. Les violations répétées peuvent entraîner la suspension ou la suppression du compte.
              </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="flag" size={24} color="#FF9800" />
                  <Text style={styles.sectionTitle}>Signalement</Text>
                </View>
              <Text style={styles.sectionText}>
                Si vous rencontrez du contenu qui viole ces règles, veuillez utiliser la fonction de signalement disponible sur chaque message ou publication. Notre équipe de modération examinera tous les signalements.
              </Text>
              </View>
            </View>

            <View style={styles.section}>
              <TouchableOpacity 
                style={styles.termsLinkCard}
                onPress={handleViewTerms}
                activeOpacity={0.7}
              >
                <Ionicons name="document-text-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.termsLink}>
                  Lire nos termes & règles de la plateforme complets
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer with Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.declineButtonText}>Je Refuse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={handleAccept}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={isLoading ? ['#BDBDBD', '#9E9E9E'] : [theme.colors.primary, theme.colors.primary]}
                style={styles.acceptButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptButtonText}>J'Accepte</Text>
                  </>
              )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Terms & Conditions Popup */}
      <Modal
        visible={showTermsPopup}
        transparent
        animationType="slide"
        onRequestClose={handleCloseTermsPopup}
      >
        <View style={styles.popupOverlay}>
          <BlurView
            intensity={20}
            tint="dark"
            style={StyleSheet.absoluteFillObject}
          />
          <View style={[styles.popupContainer, { maxHeight: screenHeight * 0.9, paddingBottom: insets.bottom }]}>
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.popupHeader}>
              <Text style={styles.popupTitle}>Termes & Règles de la Plateforme</Text>
              <TouchableOpacity
                onPress={handleCloseTermsPopup}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.popupContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.popupContentContainer}
            >
              <View style={styles.popupSection}>
                <Text style={styles.popupSectionTitle}>Règles de la Communauté</Text>
                <Text style={styles.popupText}>
                  L'Agora est un espace d'échange respectueux où les membres partagent leurs expériences, progrès et conseils de santé. Pour maintenir un environnement sûr et bienveillant, nous appliquons une politique de zéro tolérance pour le contenu inapproprié.
                </Text>

                <Text style={styles.popupSectionHeading}>❌ Contenu Strictement Interdit</Text>
                <View style={styles.popupBulletList}>
                  <Text style={styles.popupBullet}>• Discours de haine, discrimination, ou insultes ciblées</Text>
                  <Text style={styles.popupBullet}>• Violence, menaces, ou incitations à la violence</Text>
                  <Text style={styles.popupBullet}>• Contenu sexuel, nu, ou explicitement pornographique</Text>
                  <Text style={styles.popupBullet}>• Harcèlement, intimidation, ou cyberbullying</Text>
                  <Text style={styles.popupBullet}>• Spam, escroqueries, ou informations frauduleuses</Text>
                  <Text style={styles.popupBullet}>• Conseils médicaux non professionnels ou dangereux</Text>
                  <Text style={styles.popupBullet}>• Violations de droits d'auteur ou propriété intellectuelle</Text>
                  <Text style={styles.popupBullet}>• Publicités non autorisées ou promotions</Text>
                </View>

                <Text style={styles.popupSectionHeading}>📋 Modération et Application</Text>
                <Text style={styles.popupText}>
                  • Tout contenu généré par l'utilisateur est sujet à révision et modération.{'\n'}
                  • Nous pouvons supprimer le contenu qui viole ces règles à tout moment.{'\n'}
                  • Les violations répétées entraîneront la suspension ou la suppression du compte.{'\n'}
                  • Les décisions de modération sont définitives.
                </Text>

                <Text style={styles.popupSectionHeading}>🔍 Signalement et Blocage</Text>
                <Text style={styles.popupText}>
                  • Utilisez la fonction de signalement pour signaler les violations.{'\n'}
                  • Vous pouvez bloquer les utilisateurs pour arrêter la communication.{'\n'}
                  • Les signalements sont examinés par notre équipe de modération.{'\n'}
                  • Nous agissons rapidement sur tous les signalements valides.
                </Text>

                <Text style={styles.popupSectionHeading}>✅ Nos Engagements</Text>
                <Text style={styles.popupText}>
                  • Créer un environnement sûr, respectueux et inclusif.{'\n'}
                  • Appliquer les règles de manière juste et cohérente.{'\n'}
                  • Protéger la vie privée et les données de tous les utilisateurs.{'\n'}
                  • Écouter les retours et améliorer continuellement.
                </Text>
              </View>

              <View style={styles.popupSection}>
                <Text style={styles.popupSectionTitle}>Conditions d'Utilisation</Text>
                <Text style={styles.popupText}>
                  En utilisant l'application LaSo Coach, vous acceptez les conditions d'utilisation suivantes. Si vous n'êtes pas d'accord avec l'une de ces conditions, veuillez cesser d'utiliser l'application.
                </Text>

                <Text style={styles.popupSectionHeading}>1. Utilisation de l'Application</Text>
                <Text style={styles.popupText}>
                  L'application LaSo Coach est fournie à titre personnel et non commercial. Vous acceptez de ne pas la réutiliser, la revendre ou l'utiliser à des fins illégales.
                </Text>

                <Text style={styles.popupSectionHeading}>2. Contenu Utilisateur</Text>
                <Text style={styles.popupText}>
                  Vous êtes responsable de tout contenu que vous publiez. Nous nous réservons le droit de supprimer le contenu qui viole nos règles sans préavis.
                </Text>

                <Text style={styles.popupSectionHeading}>3. Responsabilité</Text>
                <Text style={styles.popupText}>
                  L'application est fournie "telle quelle". Nous ne garantissons pas sa disponibilité continue ou l'absence d'erreurs. Nous ne sommes pas responsables des dommages résultant de son utilisation.
                </Text>

                <Text style={styles.popupSectionHeading}>4. Modification des Conditions</Text>
                <Text style={styles.popupText}>
                  Nous nous réservons le droit de modifier ces conditions à tout moment. Vous serez informé des changements majeurs par notification in-app.
                </Text>
              </View>

              <View style={styles.popupSection}>
                <Text style={styles.popupSectionTitle}>Politique de Confidentialité</Text>
                <Text style={styles.popupText}>
                  Nous prenons votre vie privée très au sérieux. Cette politique explique comment nous collectons, utilisons et protégeons vos données.
                </Text>

                <Text style={styles.popupSectionHeading}>1. Données Collectées</Text>
                <Text style={styles.popupText}>
                  • Informations de profil (nom, email, avatar){'\n'}
                  • Données de santé (poids, mesures, progrès){'\n'}
                  • Photos de progression (optionnel){'\n'}
                  • Données de communication (messages, posts)
                </Text>

                <Text style={styles.popupSectionHeading}>2. Utilisation des Données</Text>
                <Text style={styles.popupText}>
                  • Améliorer l'expérience utilisateur{'\n'}
                  • Fournir le contenu personnalisé{'\n'}
                  • Envoyer des notifications{'\n'}
                  • Assurer la sécurité et la modération
                </Text>

                <Text style={styles.popupSectionHeading}>3. Suppression de Compte</Text>
                <Text style={styles.popupText}>
                  Vous pouvez demander la suppression de votre compte à tout moment depuis les paramètres de l'application. Toutes vos données personnelles seront supprimées de nos serveurs.
                </Text>

                <Text style={styles.popupSectionHeading}>4. Sécurité</Text>
                <Text style={styles.popupText}>
                  Nous utilisons le chiffrement et les meilleures pratiques de sécurité pour protéger vos données. Cependant, aucune transmission internet n'est 100% sécurisée.
                </Text>
              </View>

              <View style={styles.popupFooter}>
                <Text style={styles.popupFooterText}>
                  Dernière mise à jour : Janvier 2026
                </Text>
                <Text style={styles.popupFooterText}>
                  Questions ou préoccupations ? Contactez-nous sur notre site web.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D0D0D0',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  headerIconContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 0,
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  introCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  introText: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  termsLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  termsLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  button: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 50,
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  acceptButton: {
    overflow: 'hidden',
  },
  acceptButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Popup styles
  popupOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  popupContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 400,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  popupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  popupContent: {
    flexGrow: 1,
    flexShrink: 1,
  },
  popupContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 24,
  },
  popupSection: {
    marginBottom: 24,
  },
  popupSectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  popupText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  popupSectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  popupBulletList: {
    marginLeft: 8,
    marginBottom: 12,
  },
  popupBullet: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  popupFooter: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 32,
  },
  popupFooterText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
});

export default UgcTermsModal;
