import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { ProgressTab } from '../types';

interface ProgressTabsProps {
  activeTab: ProgressTab;
  onTabChange: (tab: ProgressTab) => void;
}

const ProgressTabs: React.FC<ProgressTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'measurements' && styles.activeTab]}
        onPress={() => onTabChange('measurements')}
      >
        <Ionicons 
          name="trending-up" 
          size={20} 
          color={activeTab === 'measurements' ? '#FFFFFF' : theme.colors.text.secondary} 
        />
        <Text style={[styles.tabText, activeTab === 'measurements' && styles.activeTabText]}>
          Mesures & Statistiques
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
        onPress={() => onTabChange('photos')}
      >
        <Ionicons 
          name="image" 
          size={20} 
          color={activeTab === 'photos' ? '#FFFFFF' : theme.colors.text.secondary} 
        />
        <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
          Photos de progression
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ProgressTabs;

