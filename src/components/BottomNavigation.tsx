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

  const bottomPadding = Math.max(insets.bottom, 8);
  // Légèrement surélever la barre pour laisser un petit espace en bas
  const bottomOffset = bottomPadding + 6;

  return (
    <View style={[
      styles.container, 
      { 
        position: 'absolute',
        bottom: bottomOffset,
        left: 16,
        right: 16,
        zIndex: 1000,
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 10,
    borderRadius: 28,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 22,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 22,
  },
});

export default BottomNavigation;

