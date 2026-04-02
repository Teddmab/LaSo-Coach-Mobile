import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
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
        {/* ✅ Header modernisé */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="settings" size={24} color={theme.colors.primary} />
            <Text style={styles.headerTitle}>Préférences</Text>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Types de notifications</Text>
          <Text style={styles.subtitle}>
            Choisissez les types de notifications que vous souhaitez recevoir
          </Text>
          
          <View style={styles.list}>
            {preferenceItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.item,
                  preferences[item.key] && styles.itemActive,
                ]}
                onPress={() => onTogglePreference(item.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  preferences[item.key] && styles.iconContainerActive,
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={preferences[item.key] ? theme.colors.primary : theme.colors.text.secondary} 
                  />
                </View>
                <Text style={[
                  styles.label,
                  preferences[item.key] && styles.labelActive,
                ]}>
                  {item.label}
                </Text>
                <Switch
                  value={preferences[item.key]}
                  onValueChange={() => onTogglePreference(item.key)}
                  trackColor={{ false: '#E0E0E0', true: theme.colors.primary + '80' }}
                  thumbColor={preferences[item.key] ? theme.colors.primary : '#F4F3F4'}
                  ios_backgroundColor="#E0E0E0"
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // ✅ Header modernisé
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 24,
    lineHeight: 20,
  },
  list: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  // ✅ Items modernisés
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemActive: {
    backgroundColor: '#F8F9FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerActive: {
    backgroundColor: theme.colors.primary + '15',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text.primary,
  },
  labelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

export default NotificationPreferencesModal;

