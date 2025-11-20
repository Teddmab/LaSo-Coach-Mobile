import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from './Avatar';
import NotificationBadge from './NotificationBadge';

/**
 * Reusable App Header Component
 * 
 * Displays a consistent header across all screens with:
 * - Logo (Dashboard) or Page Title (other screens)
 * - Help/FAQ button
 * - Notification button with badge
 * - Profile/Avatar button
 * 
 * @param {string} title - Page title to display (when showLogo is false)
 * @param {boolean} showLogo - If true, shows logo instead of title (default: false)
 * @param {function} onHelpPress - Handler for help/FAQ button press
 * @param {function} onNotificationPress - Handler for notification button press
 * @param {function} onProfilePress - Handler for profile/avatar button press
 * @param {string} avatarSource - URI for avatar image
 * @param {string} avatarFallbackText - Fallback text for avatar (e.g., first letter of name)
 * @param {boolean} showNotificationBadge - Whether to show notification badge (default: true)
 */
const AppHeader = ({
  title = '',
  showLogo = false,
  onHelpPress,
  onNotificationPress,
  onProfilePress,
  avatarSource,
  avatarFallbackText = '',
  showNotificationBadge = true,
}) => {
  return (
    <View style={[styles.header, showLogo && styles.headerWithLogo]}>
      {/* Left Side: Logo or Title */}
      <View style={styles.headerLeft}>
        {showLogo ? (
          <Image 
            source={require('../../assets/logo.png')} 
            style={[styles.headerLogo, styles.headerLogoAdjusted]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
      </View>

      {/* Right Side: Action Buttons */}
      <View style={styles.headerActions}>
        {/* Help/FAQ Button */}
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={onHelpPress}
        >
          <Ionicons 
            name="help-circle-outline" 
            size={24} 
            color={theme.colors.text.primary} 
          />
        </TouchableOpacity>

        {/* Notification Button */}
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={onNotificationPress}
        >
          <Ionicons 
            name="notifications-outline" 
            size={24} 
            color={theme.colors.text.primary} 
          />
          {showNotificationBadge && <NotificationBadge />}
        </TouchableOpacity>

        {/* Profile/Avatar Button */}
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={onProfilePress}
        >
          <Avatar 
            source={avatarSource ? { uri: avatarSource } : undefined}
            size={40}
            style={styles.profileImage}
            fallbackText={avatarFallbackText}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerWithLogo: {
    paddingLeft: 8, // Reduce left padding when showing logo
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerLogo: {
    height: 48,
    width: 180,
  },
  headerLogoAdjusted: {
    marginLeft: -20, // Move logo closer to left edge to align with title text
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    padding: 4,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  profileButton: {
    padding: 2,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default AppHeader;

