import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface LanguageScreenProps {
  onClose?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
}

const LanguageScreen: React.FC<LanguageScreenProps> = ({
  onClose,
  onTabPress,
  activeTab,
}) => {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="language" size={64} color={theme.colors.primary} />
        </View>
        
        <Text style={styles.title}>Langue & Région</Text>
        
        <Text style={styles.message}>
          Actuellement, seule la langue française est disponible dans l'application.
        </Text>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            D'autres langues seront ajoutées dans les prochaines mises à jour.
          </Text>
        </View>
        
        <View style={styles.languageCard}>
          <View style={styles.languageItem}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.languageName}>Français</Text>
          </View>
          <Text style={styles.languageStatus}>Disponible</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    marginLeft: 12,
    lineHeight: 20,
  },
  languageCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
  languageStatus: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default LanguageScreen;

