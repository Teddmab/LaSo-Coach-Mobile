import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NotificationPreferences } from '../types';

interface NotificationPreferencesModalProps {
  visible: boolean;
  preferences: NotificationPreferences;
  onClose: () => void;
  onTogglePreference: (type: keyof NotificationPreferences) => void;
}

const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  visible,
  preferences,
  onClose,
  onTogglePreference,
}) => {
  const preferenceItems = [
    { key: 'messages' as keyof NotificationPreferences, label: 'Messages', icon: 'chatbubble-ellipses' },
    { key: 'content' as keyof NotificationPreferences, label: 'Contenu', icon: 'document-text' },
    { key: 'payments' as keyof NotificationPreferences, label: 'Paiements', icon: 'card' },
    { key: 'system' as keyof NotificationPreferences, label: 'Système', icon: 'settings' },
    { key: 'marketing' as keyof NotificationPreferences, label: 'Marketing', icon: 'megaphone' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.title}>Préférences de Notifications</Text>
          
          <View style={styles.list}>
            {preferenceItems.map((item) => (
              <View key={item.key} style={styles.item}>
                <View style={styles.icon}>
                  <Ionicons name={item.icon as any} size={24} color="#666" />
                </View>
                <Text style={styles.label}>{item.label}</Text>
                <Switch
                  value={preferences[item.key]}
                  onValueChange={() => onTogglePreference(item.key)}
                  trackColor={{ false: '#E0E0E0', true: '#4285F4' }}
                  thumbColor={preferences[item.key] ? '#FFFFFF' : '#F4F3F4'}
                  ios_backgroundColor="#E0E0E0"
                />
              </View>
            ))}
          </View>

          <Text style={styles.description}>
            Ces paramètres contrôlent quels types de notifications vous recevrez.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#424242',
    marginBottom: 24,
  },
  list: {
    marginBottom: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  icon: {
    marginRight: 16,
  },
  label: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
  },
  description: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});

export default NotificationPreferencesModal;

