import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { NotificationTab } from '../types';

interface NotificationTabsProps {
  selectedTab: NotificationTab;
  onTabSelect: (tab: NotificationTab) => void;
  getTabCount: (tab: NotificationTab) => number;
}

const tabs: Array<{ id: NotificationTab; title: string }> = [
  { id: 'all', title: 'Toutes' },
  { id: 'unread', title: 'Non lues' },
  { id: 'messages', title: 'Messages' },
  { id: 'content', title: 'Contenu' },
  { id: 'payments', title: 'Paiements' },
  { id: 'system', title: 'Système' },
];

const NotificationTabs: React.FC<NotificationTabsProps> = ({
  selectedTab,
  onTabSelect,
  getTabCount,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                selectedTab === tab.id && styles.activeTab,
              ]}
              onPress={() => onTabSelect(tab.id)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.id && styles.activeTabText,
              ]}>
                {tab.title}
              </Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{getTabCount(tab.id)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginRight: 8,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
});

export default NotificationTabs;

