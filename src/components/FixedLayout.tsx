import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AppHeader from './AppHeader';
import BottomNavigation from './BottomNavigation';
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
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculer la hauteur de la barre de navigation
  const bottomNavHeight = 12 + 24 + 8 + Math.max(insets.bottom, 8);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      
      {/* Header fixe - toujours au même endroit avec SafeArea géré */}
      <View style={styles.headerContainer}>
        <AppHeader
          title={headerTitle}
          showLogo={showLogo}
          onHelpPress={onHelpPress}
          onNotificationPress={onNotificationPress}
          onProfilePress={onProfilePress}
          avatarSource={avatarSource}
          avatarFallbackText={avatarFallbackText}
          showNotificationBadge={showNotificationBadge}
        />
      </View>

      {/* Contenu avec padding pour la navigation en bas */}
      <View style={[styles.contentContainer, { paddingBottom: bottomNavHeight }]}>
        {children}
      </View>

      {/* Barre de navigation fixe - toujours en bas */}
      <BottomNavigation activeTab={activeTab} onTabPress={onTabPress} />
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
    zIndex: 100,
    // Pas de paddingTop ici, SafeAreaView le gère déjà
  },
  contentContainer: {
    flex: 1,
  },
});

export default FixedLayout;

