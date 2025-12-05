import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface NotificationSettingsScreenProps {
  onClose?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
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
          <Ionicons name="notifications" size={64} color={theme.colors.primary} />
        </View>
        
        <Text style={styles.title}>Notifications</Text>
        
        <View style={styles.statusCard}>
          <Ionicons name="checkmark-circle" size={32} color={theme.colors.primary} />
          <Text style={styles.statusText}>
            Les notifications sont activées dans l'application
          </Text>
        </View>
        
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            Vous recevrez des notifications pour les messages, les objectifs, 
            la progression et les mises à jour importantes de votre parcours.
          </Text>
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
  statusCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight + '20',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  statusText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;

