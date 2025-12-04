import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChallengeTab } from '../types';

interface ChallengeTabsProps {
  selectedTab: ChallengeTab;
  onTabChange: (tab: ChallengeTab) => void;
  tabCounts: {
    pending: number;
    my: number;
    completed: number;
  };
}

const ChallengeTabs: React.FC<ChallengeTabsProps> = ({
  selectedTab,
  onTabChange,
  tabCounts,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
        onPress={() => onTabChange('pending')}
      >
        <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
          {tabCounts.pending} À relever
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'my' && styles.activeTab]}
        onPress={() => onTabChange('my')}
      >
        <Text style={[styles.tabText, selectedTab === 'my' && styles.activeTabText]}>
          {tabCounts.my} Acceptés
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
        onPress={() => onTabChange('completed')}
      >
        <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
          {tabCounts.completed} Complétés
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2C3E50',
  },
  tabText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  activeTabText: {
    color: '#2C3E50',
    fontWeight: '600',
  },
});

export default ChallengeTabs;

