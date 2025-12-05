import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import AppHeader from '../../components/AppHeader';
import FixedLayout from '../../components/FixedLayout';

interface NotificationSettingsScreenProps {
  onClose?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  avatarSource?: any;
  avatarFallbackText?: string;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onClose,
  onTabPress,
  activeTab,
  avatarSource,
  avatarFallbackText,
}) => {
  return (
    <FixedLayout
      headerTitle="Notifications"
      activeTab={activeTab}
      onTabPress={onTabPress}
      onHelpPress={() => onTabPress?.('faq')}
      onNotificationPress={() => onTabPress?.('notifications')}
      onProfilePress={() => onTabPress?.('settings')}
      avatarSource={avatarSource}
      avatarFallbackText={avatarFallbackText}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={64} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.title}>Paramètres de Notifications</Text>
          
          <Text style={styles.message}>
            Actuellement, seule la langue française est disponible pour les notifications.
          </Text>
          
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              Les notifications sont actuellement disponibles uniquement en français. D'autres langues seront ajoutées dans les prochaines mises à jour.
            </Text>
          </View>
          
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>Fonctionnalités disponibles :</Text>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Notifications push</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Notifications de messages</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Notifications d'objectifs</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.featureText}>Notifications de progression</Text>
            </View>
          </View>
        </View>
      </View>
    </FixedLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  featuresCard: {
    width: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.text.primary,
    marginLeft: 12,
  },
});

export default NotificationSettingsScreen;

