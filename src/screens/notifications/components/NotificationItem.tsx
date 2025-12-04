import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { Notification } from '../types';
import { getNotificationIcon, formatNotificationTime, translateNotificationTitle, translateNotificationMessage } from '../utils/notificationUtils';

interface NotificationItemProps {
  notification: Notification;
  onPress: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onMarkAsRead,
  onDelete,
}) => {
  const icon = getNotificationIcon(notification.type);
  
  const getCategoryLabel = (): string => {
    switch (notification.type) {
      case 'content_assigned':
        return 'Contenu';
      case 'chat_message':
        return 'Message';
      case 'session':
        return 'Session';
      case 'payment':
        return 'Paiement';
      case 'system':
        return 'Système';
      default:
        return 'Notification';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.icon}>
        <Ionicons name={icon.name as any} size={24} color={icon.color} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[
            styles.title,
            !notification.read && styles.unreadTitle,
          ]}>
            {translateNotificationTitle(notification.title)}
          </Text>
          <View style={styles.badges}>
            <View style={[
              styles.categoryBadge,
              notification.type === 'content_assigned' && styles.contentBadge,
              notification.type === 'system' && styles.systemBadge,
              notification.type === 'chat_message' && styles.messageBadge,
              notification.type === 'session' && styles.sessionBadge,
              notification.type === 'payment' && styles.paymentBadge,
            ]}>
              <Text style={styles.categoryText}>{getCategoryLabel()}</Text>
            </View>
            {!notification.read && (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>Nouveau</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.description}>
          {translateNotificationMessage(notification.message || notification.description)}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.time}>
            {formatNotificationTime(notification.createdAt)}
          </Text>
          <View style={styles.actions}>
            {!notification.read && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onMarkAsRead();
                }}
              >
                <Text style={styles.actionText}>Marquer comme lu</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={(e) => {
                e?.stopPropagation?.();
                onDelete();
              }}
            >
              <Text style={[styles.actionText, styles.deleteText]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  unread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2196F3',
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  contentBadge: {
    backgroundColor: '#E8F5E9',
  },
  systemBadge: {
    backgroundColor: '#F3E5F5',
  },
  messageBadge: {
    backgroundColor: '#E3F2FD',
  },
  sessionBadge: {
    backgroundColor: '#FFF3E0',
  },
  paymentBadge: {
    backgroundColor: '#FFEBEE',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
  },
  newBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  time: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#2196F3',
  },
  deleteButton: {
    // Additional styles if needed
  },
  deleteText: {
    color: '#F44336',
  },
});

export default NotificationItem;

