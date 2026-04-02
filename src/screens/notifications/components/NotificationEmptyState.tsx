import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { NotificationTab } from '../types';

interface NotificationEmptyStateProps {
  selectedTab: NotificationTab;
}

const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = ({ selectedTab }) => {
  const getMessage = (): string => {
    switch (selectedTab) {
      case 'unread':
        return 'Vous n\'avez aucune notification non lue';
      case 'all':
        return 'Vous n\'avez aucune notification';
      case 'messages':
        return 'Aucune notification de type Messages';
      case 'content':
        return 'Aucune notification de type Contenu';
      case 'payments':
        return 'Aucune notification de type Paiements';
      case 'system':
        return 'Aucune notification de type Système';
      default:
        return `Aucune notification de type ${selectedTab}`;
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="notifications-outline" size={64} color="#E0E0E0" />
      <Text style={styles.title}>Aucune notification</Text>
      <Text style={styles.text}>{getMessage()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default NotificationEmptyState;

