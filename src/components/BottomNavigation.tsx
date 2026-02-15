import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface BottomNavigationProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab, onTabPress }) => {
  const insets = useSafeAreaInsets();
  
  // ✅ FIX: Ne pas utiliser de default value pour activeTab
  // Si activeTab est vide (''), aucun tab ne doit être actif
  const currentActiveTab = activeTab || null;

  const tabs = [
    { id: 'home', icon: 'home', activeIcon: 'home' },
    { id: 'progress', icon: 'trending-up-outline', activeIcon: 'trending-up' },
    { id: 'nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { id: 'achievements', icon: 'trophy-outline', activeIcon: 'trophy' },
    { id: 'more', icon: 'add-outline', activeIcon: 'add' }
  ];

  // Use a minimum safe area bottom padding, defaulting to 16 if insets aren't ready yet
  // This ensures consistent positioning even on first launch
  const bottomPadding = insets.bottom > 0 ? Math.max(insets.bottom, 16) : 16;

  return (
    <View style={styles.wrapper}>
      {/* ✅ Effet glassmorphism avec BlurView */}
      <BlurView
        intensity={Platform.OS === 'ios' ? 80 : 20}
        tint="light"
        style={[
          styles.blurContainer,
          { 
            paddingBottom: bottomPadding,
          }
        ]}
      >
        {/* Bordure supérieure subtile pour l'effet glass */}
        <View style={styles.topBorder} />
        
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              currentActiveTab === tab.id && styles.activeTab
            ]}
            onPress={() => onTabPress?.(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={(currentActiveTab === tab.id ? tab.activeIcon : tab.icon) as any}
              size={24}
              color={currentActiveTab === tab.id ? theme.colors.primary : theme.colors.text.secondary}
            />
          </TouchableOpacity>
        ))}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  blurContainer: {
    flexDirection: 'row',
    paddingTop: 9,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // ✅ Ajuster l'opacité pour un meilleur effet glassmorphism sur toutes les plateformes
    backgroundColor: Platform.OS === 'ios' 
      ? 'rgba(255, 255, 255, 0.7)' // Fond semi-transparent pour iOS avec BlurView natif
      : 'rgba(255, 255, 255, 0.75)', // Réduire l'opacité sur Android pour voir l'effet blur
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    // Ombre subtile pour l'effet de profondeur
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8, // Pour Android
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    // Note: React Native ne supporte pas la propriété 'transition' dans StyleSheet
    // Les transitions sont gérées par Animated API ou par les props du composant
  },
  activeTab: {
    backgroundColor: Platform.OS === 'ios'
      ? 'rgba(76, 175, 80, 0.15)' // Vert très transparent pour iOS
      : 'rgba(76, 175, 80, 0.2)', // Légèrement plus opaque pour Android
    borderRadius: 12,
  },
});

export default BottomNavigation;