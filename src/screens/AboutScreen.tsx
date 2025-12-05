import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';

interface AboutScreenProps {
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
}

const AboutScreen: React.FC<AboutScreenProps> = ({
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
}) => {
  const appVersion = '1.0.0'; // Version depuis app.json

  return (
    <FixedLayout
      headerTitle="À propos de l'application"
      activeTab={activeTab}
      onTabPress={onTabPress}
      onHelpPress={() => {}}
      onNotificationPress={() => {}}
      onProfilePress={() => {}}
      avatarSource={avatarSource}
      avatarFallbackText={avatarFallbackText}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* App Icon/Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>LaSo Coach</Text>
            <Text style={styles.version}>Version {appVersion}</Text>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>
              LaSo Coach est votre compagnon de santé et bien-être personnel. 
              L'application vous accompagne dans votre parcours vers une vie plus saine 
              grâce à des programmes personnalisés, un suivi nutritionnel, des défis 
              motivants et une communauté engagée.
            </Text>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fonctionnalités</Text>
            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Suivi de progression personnalisé</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Plans nutritionnels adaptés</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Défis et badges motivants</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Communauté active et support</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>Coaching personnalisé</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2025 LaSo Coach</Text>
            <Text style={styles.footerSubtext}>We are what we eat! 🥗</Text>
          </View>
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
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  logoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.secondary,
    textAlign: 'justify',
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default AboutScreen;

