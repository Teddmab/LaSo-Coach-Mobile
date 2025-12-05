import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from './Avatar';
import NotificationBadge from './NotificationBadge';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onHelpPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: ImageSourcePropType | string;
  avatarFallbackText?: string;
  showNotificationBadge?: boolean;
}

/**
 * Reusable App Header Component
 * 
 * Displays a consistent header across all screens with:
 * - Logo (Dashboard) or Page Title (other screens)
 * - Help/FAQ button
 * - Notification button with badge
 * - Profile/Avatar button
 */
const AppHeader: React.FC<AppHeaderProps> = ({
  title = '',
  showLogo = false,
  onHelpPress,
  onNotificationPress,
  onProfilePress,
  avatarSource,
  avatarFallbackText = '',
  showNotificationBadge = true,
}) => {
  // Animation douce du contenu gauche (logo / titre) lorsqu'on change d'écran
  const leftOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    leftOpacity.setValue(0);
    Animated.timing(leftOpacity, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [title, showLogo, leftOpacity]);

  return (
    <View style={[styles.header, showLogo && styles.headerWithLogo]}>
      {/* Left Side: Logo or Title */}
      <Animated.View style={[styles.headerLeft, { opacity: leftOpacity }]}>
        {showLogo ? (
          <Image 
            source={require('../../assets/logo.png')} 
            style={[styles.headerLogo, styles.headerLogoAdjusted]}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
      </Animated.View>

      {/* Right Side: Action Buttons */}
      <View style={styles.headerRight}>
        {/* Help/FAQ Button */}
        {onHelpPress && (
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onHelpPress}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}

        {/* Notification Button */}
        {onNotificationPress && (
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text.primary} />
            {showNotificationBadge && <NotificationBadge />}
          </TouchableOpacity>
        )}

        {/* Profile/Avatar Button */}
        {onProfilePress && (
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={onProfilePress}
            activeOpacity={0.7}
          >
            <Avatar 
              source={typeof avatarSource === 'string' ? { uri: avatarSource } : avatarSource}
              size={32}
              fallbackText={avatarFallbackText}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 64, // Hauteur fixe standard pour tous les écrans
  },
  headerWithLogo: {
    paddingVertical: 14,
    minHeight: 64,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  headerLogo: {
    width: 120,
    height: 40,
  },
  headerLogoAdjusted: {
    width: 100,
    height: 35,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
    position: 'relative',
  },
});

export default AppHeader;

