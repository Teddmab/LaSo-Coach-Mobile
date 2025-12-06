import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface BottomNavigationProps {
  activeTab?: string;
  onTabPress?: (tabId: string) => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ activeTab = 'home', onTabPress }) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home', icon: 'home', activeIcon: 'home' },
    { id: 'progress', icon: 'trending-up-outline', activeIcon: 'trending-up' },
    { id: 'nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { id: 'achievements', icon: 'trophy-outline', activeIcon: 'trophy' },
    { id: 'more', icon: 'add-outline', activeIcon: 'add' }
  ];

  const bottomPadding = Math.max(insets.bottom, 16); // Padding généreux pour le safe area

  return (
    <View style={[
      styles.container, 
      { 
        paddingBottom: bottomPadding,
      }
    ]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tab,
            activeTab === tab.id && styles.activeTab
          ]}
          onPress={() => onTabPress?.(tab.id)}
          activeOpacity={0.7}
        >
          <Ionicons
            name={(activeTab === tab.id ? tab.activeIcon : tab.icon) as any}
            size={24}
            color={activeTab === tab.id ? theme.colors.primary : theme.colors.text.secondary}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 9, // Padding généreux en haut
    paddingHorizontal: 16, // Padding généreux sur les côtés
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0', // Bordure supérieure pour séparer du contenu
    width: '100%', // Prend toute la largeur de l'écran
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12, // Padding généreux vertical
  },
  activeTab: {
    backgroundColor: theme.colors.primaryLight, // Arrière-plan vert clair pour l'onglet actif
    borderRadius: 12, // Coins arrondis pour une meilleure UX
  },
});

export default BottomNavigation;

