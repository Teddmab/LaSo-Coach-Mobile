import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

const BottomNavigation = ({ activeTab = 'home', onTabPress }) => {
  const tabs = [
    { id: 'home', icon: 'home', activeIcon: 'home' },
    { id: 'progress', icon: 'trending-up-outline', activeIcon: 'trending-up' },
    { id: 'nutrition', icon: 'restaurant-outline', activeIcon: 'restaurant' },
    { id: 'achievements', icon: 'trophy-outline', activeIcon: 'trophy' },
    { id: 'more', icon: 'add-outline', activeIcon: 'add' }
  ];

  return (
    <View style={styles.container}>
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
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
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

export default BottomNavigation; 