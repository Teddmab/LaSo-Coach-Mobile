import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const BottomNavigation = ({ activeTab = 'home', onTabPress }) => {
  const insets = useSafeAreaInsets();

  const tabs = [
    { id: 'home', icon: 'home', activeIcon: 'home' },
    { id: 'progress', icon: 'trending-up-outline', activeIcon: 'trending-up' },
    { id: 'nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { id: 'achievements', icon: 'trophy-outline', activeIcon: 'trophy' },
    { id: 'more', icon: 'add-outline', activeIcon: 'add' }
  ];

  // Calculer la hauteur totale de la barre de navigation
  const bottomPadding = Math.max(insets.bottom, 8);
  const totalHeight = 12 + 24 + 8 + bottomPadding; // paddingVertical top + icon size + paddingVertical bottom + safe area

  return (
    <View style={[
      styles.container, 
      { 
        paddingBottom: bottomPadding,
        // Position fixe en bas de l'écran
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000, // S'assurer qu'elle est au-dessus du contenu
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
            name={activeTab === tab.id ? tab.activeIcon : tab.icon}
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
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    // Shadow pour donner un effet d'élévation
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5, // Pour Android
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: theme.colors.primaryLight,
  },
});

// Export une fonction helper pour obtenir la hauteur de la navigation
// Utile pour ajouter un padding bottom au contenu
export const getBottomNavigationHeight = (insets) => {
  const bottomPadding = Math.max(insets.bottom, 8);
  return 12 + 24 + 8 + bottomPadding + 12; // paddingTop + icon + paddingBottom + safeArea + paddingTop
};

export default BottomNavigation; 