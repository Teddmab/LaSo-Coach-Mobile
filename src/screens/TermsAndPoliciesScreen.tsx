import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../constants/theme';

/**
 * TermsAndPoliciesScreen
 * 
 * Displays complete terms, conditions, and community policies in French.
 * Referenced from:
 * - UgcTermsModal (when user taps "Lire nos termes & règles complets")
 * - Settings menu (if included)
 * 
 * Apple Compliance:
 * - Guideline 1.2: Complete UGC moderation policy
 * - Guideline 5.1.1: Legal notices and terms
 */

export const TermsAndPoliciesScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'community'>('community');

  const handleExternalLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Termes & Politiques</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'community' && styles.activeTab]}
          onPress={() => setActiveTab('community')}
        >
          <Text style={[styles.tabText, activeTab === 'community' && styles.activeTabText]}>
            Règles Communauté
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'terms' && styles.activeTab]}
          onPress={() => setActiveTab('terms')}
        >
          <Text style={[styles.tabText, activeTab === 'terms' && styles.activeTabText]}>
            Conditions d'Utilisation
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'privacy' && styles.activeTab]}
          onPress={() => setActiveTab('privacy')}
        >
          <Text style={[styles.tabText, activeTab === 'privacy' && styles.activeTabText]}>
            Confidentialité
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        {activeTab === 'community' && (
          <View style={styles.section}>
            <Text style={styles.title}>Règles de la Communauté</Text>

            <Text style={styles.introText}>
              L'Agora est un espace d'échange respectueux où les membres partagent leurs expériences, progrès et conseils de santé. Pour maintenir un environnement sûr et bienveillant, nous appliquons une politique de zéro tolérance pour le contenu inapproprié.
            </Text>

            <Text style={styles.sectionHeading}>❌ Contenu Strictement Interdit</Text>
            <View style={styles.bulletList}>
              <Text style={styles.bullet}>• Discours de haine, discrimination, ou insultes ciblées</Text>
              <Text style={styles.bullet}>• Violence, menaces, ou incitations à la violence</Text>
              <Text style={styles.bullet}>• Contenu sexuel, nu, ou explicitement pornographique</Text>
              <Text style={styles.bullet}>• Harcèlement, intimidation, ou cyberbullying</Text>
              <Text style={styles.bullet}>• Spam, escroqueries, ou informations frauduleuses</Text>
              <Text style={styles.bullet}>• Conseils médicaux non professionnels ou dangereux</Text>
              <Text style={styles.bullet}>• Violations de droits d'auteur ou propriété intellectuelle</Text>
              <Text style={styles.bullet}>• Publicités non autorisées ou promotions</Text>
            </View>

            <Text style={styles.sectionHeading}>📋 Modération et Application</Text>
            <Text style={styles.bodyText}>
              • Tout contenu généré par l'utilisateur est sujet à révision et modération.{'\n'}
              • Nous pouvons supprimer le contenu qui viole ces règles à tout moment.{'\n'}
              • Les violations répétées entraîneront la suspension ou la suppression du compte.{'\n'}
              • Les décisions de modération sont définitives.
            </Text>

            <Text style={styles.sectionHeading}>🔍 Signalement et Blocage</Text>
            <Text style={styles.bodyText}>
              • Utilisez la fonction de signalement pour signaler les violations.{'\n'}
              • Vous pouvez bloquer les utilisateurs pour arrêter la communication.{'\n'}
              • Les signalements sont examinés par notre équipe de modération.{'\n'}
              • Nous agissons rapidement sur tous les signalements valides.
            </Text>

            <Text style={styles.sectionHeading}>✅ Nos Engagements</Text>
            <Text style={styles.bodyText}>
              • Créer un environnement sûr, respectueux et inclusif.{'\n'}
              • Appliquer les règles de manière juste et cohérente.{'\n'}
              • Protéger la vie privée et les données de tous les utilisateurs.{'\n'}
              • Écouter les retours et améliorer continuellement.
            </Text>

            <View style={styles.externalLink}>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://lasocoach.com/regles-de-la-communaute/')}
              >
                <Text style={styles.linkText}>
                  📖 Voir la version complète en ligne
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'terms' && (
          <View style={styles.section}>
            <Text style={styles.title}>Conditions d'Utilisation</Text>

            <Text style={styles.introText}>
              En utilisant l'application LaSo Coach, vous acceptez les conditions d'utilisation suivantes. Si vous n'êtes pas d'accord avec l'une de ces conditions, veuillez cesser d'utiliser l'application.
            </Text>

            <Text style={styles.sectionHeading}>1. Utilisation de l'Application</Text>
            <Text style={styles.bodyText}>
              L'application LaSo Coach est fournie à titre personnel et non commercial. Vous acceptez de ne pas la réutiliser, la revendre ou l'utiliser à des fins illégales.
            </Text>

            <Text style={styles.sectionHeading}>2. Contenu Utilisateur</Text>
            <Text style={styles.bodyText}>
              Vous êtes responsable de tout contenu que vous publiez. Nous nous réservons le droit de supprimer le contenu qui viole nos règles sans préavis.
            </Text>

            <Text style={styles.sectionHeading}>3. Responsabilité</Text>
            <Text style={styles.bodyText}>
              L'application est fournie "telle quelle". Nous ne garantissons pas sa disponibilité continue ou l'absence d'erreurs. Nous ne sommes pas responsables des dommages résultant de son utilisation.
            </Text>

            <Text style={styles.sectionHeading}>4. Modification des Conditions</Text>
            <Text style={styles.bodyText}>
              Nous nous réservons le droit de modifier ces conditions à tout moment. Vous serez informé des changements majeurs par notification in-app.
            </Text>

            <View style={styles.externalLink}>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://lasocoach.com/conditions-utilisation/')}
              >
                <Text style={styles.linkText}>
                  📖 Voir la version complète en ligne
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === 'privacy' && (
          <View style={styles.section}>
            <Text style={styles.title}>Politique de Confidentialité</Text>

            <Text style={styles.introText}>
              Nous prenons votre vie privée très au sérieux. Cette politique explique comment nous collectons, utilisons et protégeons vos données.
            </Text>

            <Text style={styles.sectionHeading}>1. Données Collectées</Text>
            <Text style={styles.bodyText}>
              • Informations de profil (nom, email, avatar){'\n'}
              • Données de santé (poids, mesures, progrès){'\n'}
              • Photos de progression (optionnel){'\n'}
              • Données de communication (messages, posts)
            </Text>

            <Text style={styles.sectionHeading}>2. Utilisation des Données</Text>
            <Text style={styles.bodyText}>
              • Améliorer l'expérience utilisateur{'\n'}
              • Fournir le contenu personnalisé{'\n'}
              • Envoyer des notifications{'\n'}
              • Assurer la sécurité et la modération
            </Text>

            <Text style={styles.sectionHeading}>3. Suppression de Compte</Text>
            <Text style={styles.bodyText}>
              Vous pouvez demander la suppression de votre compte à tout moment depuis les paramètres de l'application. Toutes vos données personnelles seront supprimées de nos serveurs.
            </Text>

            <Text style={styles.sectionHeading}>4. Sécurité</Text>
            <Text style={styles.bodyText}>
              Nous utilisons le chiffrement et les meilleures pratiques de sécurité pour protéger vos données. Cependant, aucune transmission internet n'est 100% sécurisée.
            </Text>

            <View style={styles.externalLink}>
              <TouchableOpacity
                onPress={() => handleExternalLink('https://lasocoach.com/politique-confidentialite/')}
              >
                <Text style={styles.linkText}>
                  📖 Voir la version complète en ligne
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dernière mise à jour : Janvier 2026
          </Text>
          <Text style={styles.footerText}>
            Questions ou préoccupations ? Contactez-nous sur notre site web.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  introText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
    marginBottom: 16,
    fontWeight: '500',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  bulletList: {
    marginLeft: 8,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  externalLink: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    marginBottom: 32,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
});

export default TermsAndPoliciesScreen;
