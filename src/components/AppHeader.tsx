import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ImageSourcePropType } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import Avatar from './Avatar';
import NotificationBadge from './NotificationBadge';
import imageCache from '../utils/imageCache';
import ImagePersistent from './ImagePersistent';

// Précharger le logo au chargement du module
const LOGO_SOURCE = require('../../assets/logo.png');
imageCache.preloadLocalImage('logo', LOGO_SOURCE);
import { useIOSSimulation } from '../hooks/useIOSSimulation';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  onHelpPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: ImageSourcePropType | string;
  avatarFallbackText?: string;
  showNotificationBadge?: boolean;
  showBackButton?: boolean;
  onBackPress?: () => void;
  subscriptionMessage?: string; // Message optionnel pour iOS quand abonnement expiré
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
  showBackButton = false,
  onBackPress,
  subscriptionMessage,
}) => {
  const { shouldShowIOSOnly } = useIOSSimulation();
  const isIOS = shouldShowIOSOnly();
  const shouldShowBackButton = isIOS && showBackButton && onBackPress;

  return (
    <View style={[styles.header, showLogo && styles.headerWithLogo, subscriptionMessage && isIOS && styles.headerWithMessage]}>
      {/* Left Side: Back Button (iOS) + Logo or Title */}
      <View style={styles.headerLeft}>
        {/* Back Button à gauche (iOS seulement) */}
        {shouldShowBackButton && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        )}
        <View style={styles.titleContainer}>
          {showLogo ? (
            <ImagePersistent
              source={imageCache.getLocalImage('logo') || LOGO_SOURCE} 
              style={[styles.headerLogo, styles.headerLogoAdjusted]}
              resizeMode="contain"
              fallbackSource={LOGO_SOURCE}
            />
          ) : (
            <View style={styles.titleWithIcon}>
              <Text 
                style={[
                  styles.headerTitle,
                  title.length > 20 && styles.headerTitleLong // Réduire la taille si le titre est trop long
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {/* ✅ Icônes à droite du titre pour chaque page */}
              {title === 'Notifications' && (
                <Ionicons 
                  name="notifications" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {title === 'Progression' && (
                <Ionicons 
                  name="trending-up" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {title === 'Nutrition' && (
                <Ionicons 
                  name="restaurant" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {title === 'Réalisations' && (
                <Ionicons 
                  name="trophy" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {title === 'Configurations' && (
                <Ionicons 
                  name="settings" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {title === 'FAQ' && (
                <Ionicons 
                  name="help-circle" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
              {(title === 'Profil' || title === 'Profile') && (
                <Ionicons 
                  name="person" 
                  size={22} 
                  color={theme.colors.primary} 
                  style={styles.titleIconRight}
                />
              )}
            </View>
          )}
          {/* Message d'abonnement expiré sur iOS (sans bouton) */}
          {subscriptionMessage && isIOS && (
            <Text style={styles.subscriptionMessage}>{subscriptionMessage}</Text>
          )}
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100%', // Prend toute la hauteur disponible
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    marginRight: 2,
  },
  titleIconRight: {
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    lineHeight: 24, // Hauteur de ligne fixe pour un alignement cohérent
    includeFontPadding: false, // Évite le padding supplémentaire sur Android
    textAlignVertical: 'center', // Aligne verticalement le texte
    flexShrink: 1, // Permet au texte de rétrécir si nécessaire
  },
  headerTitleLong: {
    fontSize: 16, // Réduire la taille pour les titres longs
  },
  subscriptionMessage: {
    fontSize: 11,
    color: theme.colors.text.secondary,
    marginTop: 2,
    fontStyle: 'italic',
    includeFontPadding: false,
  },
  headerWithMessage: {
    minHeight: 72, // Augmenter la hauteur si message présent
    height: 72,
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
  backButton: {
    padding: 8,
    marginLeft: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppHeader;

