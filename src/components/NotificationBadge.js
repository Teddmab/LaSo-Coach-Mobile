import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNotifications } from '../context/NotificationContext';

const NotificationBadge = ({ size = 20, style }) => {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <View style={[styles.badge, { minWidth: size, height: size }, style]}>
      <Text style={[styles.badgeText, { fontSize: size * 0.6 }]}>
        {unreadCount > 99 ? '99+' : unreadCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default NotificationBadge;

