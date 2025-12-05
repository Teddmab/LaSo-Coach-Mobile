import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import FixedLayout from '../components/FixedLayout';

interface SecurityScreenProps {
  onClose: () => void;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  avatarSource?: any;
  avatarFallbackText?: string;
  onLinkPress: (linkId: string) => void;
}

const SecurityScreen: React.FC<SecurityScreenProps> = ({
  onClose,
  activeTab,
  onTabPress,
  avatarSource,
  avatarFallbackText,
  onLinkPress,
}) => {
  return (
    <FixedLayout
      headerTitle="Sécurité & Connexion"
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
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="lock-closed" size={64} color={theme.colors.primary} />
            </View>
          </View>

          {/* Description Section */}
          <Text style={styles.description}>
            Consultez nos documents importants pour comprendre nos politiques de sécurité, 
            nos conditions d'utilisation et les règles de la plateforme.
          </Text>

          {/* Links Section */}
          <View style={styles.linksSection}>
            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => onLinkPress('privacy-policy')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.linkText}>Politique de confidentialité</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => onLinkPress('terms-of-service')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.linkText}>Termes de service</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkCard}
              onPress={() => onLinkPress('platform-rules')}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.linkText}>Règles de la plateforme</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
            </TouchableOpacity>
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
    marginBottom: 24,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 10,
  },
  linksSection: {
    gap: 12,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
});

export default SecurityScreen;
