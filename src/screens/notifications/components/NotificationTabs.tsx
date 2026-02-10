import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { NotificationTab } from '../types';

interface NotificationTabsProps {
  selectedTab: NotificationTab;
  onTabSelect: (tab: NotificationTab) => void;
  getTabCount: (tab: NotificationTab) => number;
}

const tabs: Array<{ id: NotificationTab; title: string; icon: string }> = [
  { id: 'all', title: 'Toutes', icon: 'apps-outline' },
  { id: 'unread', title: 'Non lues', icon: 'mail-unread-outline' },
  { id: 'messages', title: 'Messages', icon: 'chatbubble-ellipses-outline' },
  { id: 'content', title: 'Contenu', icon: 'document-text-outline' },
  { id: 'payments', title: 'Paiements', icon: 'card-outline' },
  { id: 'system', title: 'Système', icon: 'settings-outline' },
];

const NotificationTabs: React.FC<NotificationTabsProps> = ({
  selectedTab,
  onTabSelect,
  getTabCount,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = selectedTab === tab.id;
          const count = getTabCount(tab.id);
          
          return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                isActive && styles.activeTab,
              ]}
              onPress={() => onTabSelect(tab.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={isActive ? '#FFFFFF' : theme.colors.text.secondary} 
                style={styles.tabIcon}
              />
              <Text style={[
                styles.tabText,
                isActive && styles.activeTabText,
              ]}>
                {tab.title}
              </Text>
              {count > 0 && (
                <View style={[
                  styles.badge,
                  isActive && styles.activeBadge,
                ]}>
                  <Text style={[
                    styles.badgeText,
                    isActive && styles.activeBadgeText,
                  ]}>
                    {count > 99 ? '99+' : count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  // ✅ Onglets modernisés
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabIcon: {
    marginRight: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  badge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  activeBadgeText: {
    color: '#FFFFFF',
  },
});

export default NotificationTabs;

