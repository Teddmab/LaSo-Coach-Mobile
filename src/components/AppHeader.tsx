import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
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
  return (
    <View style={[styles.header, showLogo && styles.headerWithLogo]}>
      {/* Left Side: Logo or Title - Pas d'animation pour éviter l'effet de chargement */}
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
    height: 64, // Hauteur fixe absolue pour tous les écrans (logo ou titre)
    minHeight: 64, // Garantit une hauteur minimale
    marginTop:32,
  },
  headerWithLogo: {
    // Même hauteur que sans logo pour éviter que le contenu monte
    height: 64,
    minHeight: 64,
  },
  headerLeft: {
    flex: 1,
    justifyContent: 'center', // Aligne verticalement le contenu (logo ou titre)
    height: '100%', // Prend toute la hauteur disponible
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    lineHeight: 24, // Hauteur de ligne fixe pour un alignement cohérent
    includeFontPadding: false, // Évite le padding supplémentaire sur Android
    textAlignVertical: 'center', // Aligne verticalement le texte
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
    justifyContent: 'center', // Aligne verticalement les boutons
    height: '100%', // Prend toute la hauteur disponible
  },
  headerButton: {
    padding: 4,
    position: 'relative',
    justifyContent: 'center', // Aligne verticalement le contenu du bouton
    alignItems: 'center', // Aligne horizontalement le contenu du bouton
  },
});

export default AppHeader;

