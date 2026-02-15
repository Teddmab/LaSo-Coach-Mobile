import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
} from 'react-native';
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

  const getCategoryBadgeStyle = () => {
    switch (notification.type) {
      case 'content_assigned':
        return styles.contentBadge;
      case 'system':
        return styles.systemBadge;
      case 'chat_message':
        return styles.messageBadge;
      case 'session':
        return styles.sessionBadge;
      case 'payment':
        return styles.paymentBadge;
      default:
        return styles.defaultBadge;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unread,
      ]}
      onPress={() => {
        if (!notification.read) {
          onMarkAsRead();
        }
        onPress();
      }}
      activeOpacity={0.7}
    >
      {/* Header avec icône et titre */}
      <View style={styles.headerRow}>
        <View style={styles.icon}>
          <Ionicons name={icon.name as any} size={24} color={icon.color} />
        </View>

        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !notification.read && styles.unreadTitle,
            ]} numberOfLines={2}>
              {translateNotificationTitle(notification.title)}
            </Text>
            
            {!notification.read && (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>Nouveau</Text>
              </View>
            )}
          </View>
          
          <View style={styles.badgesRow}>
            <View style={[styles.categoryBadge, getCategoryBadgeStyle()]}>
              <Text style={styles.categoryText}>{getCategoryLabel()}</Text>
            </View>
            
            <Text style={styles.time}>
              {formatNotificationTime(notification.createdAt)}
            </Text>
          </View>
        </View>

        {/* Bouton de suppression */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e?.stopPropagation?.();
            onDelete();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Message/Description */}
      {(notification.message || notification.description) && (
        <View style={styles.messageContainer}>
          <Text style={styles.description} numberOfLines={3}>
            {translateNotificationMessage(notification.message || notification.description)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unread: {
    backgroundColor: '#F0F7FF',
    borderColor: '#2196F3',
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
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
  headerContent: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    flex: 1,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1976D2',
  },
  newBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  defaultBadge: {
    backgroundColor: '#E0E0E0',
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
  time: {
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  messageContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
  },
  description: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    marginLeft: 8,
    alignSelf: 'flex-start',
  },
});

export default NotificationItem;
