import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';
import NetworkStatus from './NetworkStatus';
import type { ImageSourcePropType } from 'react-native';

interface FixedLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  showLogo?: boolean;
  onHelpPress?: () => void;
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  avatarSource?: ImageSourcePropType | string;
  avatarFallbackText?: string;
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
  showNotificationBadge?: boolean;
  /** Permet de masquer le header interne si l'écran gère déjà son propre AppHeader */
  hideHeader?: boolean;
  /** Affiche un bouton retour dans le header (iOS uniquement) */
  showBackButton?: boolean;
  /** Callback appelé quand le bouton retour est pressé */
  onBackPress?: () => void;
}

/**
 * FixedLayout - Layout fixe avec header et navigation
 * 
 * Garantit que le header et la barre de navigation restent fixes
 * sur toutes les sections, seul le contenu change
 */
const FixedLayout: React.FC<FixedLayoutProps> = ({
  children,
  headerTitle = '',
  showLogo = false,
  onHelpPress,
  onNotificationPress,
  onProfilePress,
  avatarSource,
  avatarFallbackText = '',
  activeTab = 'home',
  onTabPress,
  showNotificationBadge = true,
  hideHeader = false,
  showBackButton = false,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculer la hauteur de la barre de navigation (utilisée pour éviter que le contenu passe sous la barre)
  // Use a minimum safe area bottom padding, defaulting to 8 if insets aren't ready yet
  // This ensures consistent positioning even on first launch
  const safeBottomInset = insets.bottom > 0 ? Math.max(insets.bottom, 8) : 8;
  const bottomNavHeight = 12 + 24 + 8 + safeBottomInset;
  const contentBottomPadding = Math.max(bottomNavHeight - 20, 16);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']} pointerEvents="box-none">
      <StatusBar style="dark" />
      {/* Banniere réseau flottante (offline / reconnexion) */}
      <NetworkStatus />

      {/* Header fixe - optionnel (certains écrans comme Profile gèrent leur propre AppHeader) */}
      {!hideHeader && (
        <View style={styles.headerContainer} pointerEvents="box-none">
          <AppHeader
            title={headerTitle}
            showLogo={showLogo}
            onHelpPress={onHelpPress}
            onNotificationPress={onNotificationPress}
            onProfilePress={onProfilePress}
            avatarSource={avatarSource}
            avatarFallbackText={avatarFallbackText}
            showNotificationBadge={showNotificationBadge}
            showBackButton={showBackButton}
            onBackPress={onBackPress}
          />
        </View>
      )}

      {/* Contenu avec padding pour le header en haut et la navigation en bas */}
      <View style={[styles.contentContainer, { 
        paddingTop: !hideHeader ? 64 : 0, // Hauteur fixe du header (64px) si visible
        paddingBottom: contentBottomPadding 
      }]} pointerEvents="box-none">
        {children}
      </View>

      {/* Barre de navigation fixe - toujours en bas avec position absolute, ne bouge JAMAIS avec le clavier */}
      <View style={styles.bottomNavContainer} pointerEvents="auto">
        <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    // Pas de paddingTop ici, SafeAreaView le gère déjà
  },
  contentContainer: {
    flex: 1,
    // Le padding est géré dynamiquement pour le header et la navigation
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10000, // Z-index très élevé pour rester au-dessus de tout
    paddingHorizontal: 0, // Les marges sont gérées par BottomNavigation lui-même
    // Note: paddingBottom est géré par BottomNavigation avec useSafeAreaInsets
    // Ne pas ajouter de paddingBottom ici pour éviter le double padding
    // IMPORTANT: Cette barre ne doit JAMAIS bouger avec le clavier
    // Elle reste toujours en bas de l'écran, même quand le clavier est ouvert
    // Utiliser elevation pour Android pour s'assurer qu'elle reste au-dessus
    elevation: 10000, // Android - très élevé pour rester au-dessus
    shadowColor: '#000', // iOS
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backgroundColor: '#FFFFFF', // Fond blanc pour s'assurer qu'elle couvre ce qui est en dessous
  },
});

export default FixedLayout;

