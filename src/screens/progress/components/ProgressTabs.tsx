import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface ProgressTabsProps {
  // Props conservées pour compatibilité mais non utilisées
}

const ProgressTabs: React.FC<ProgressTabsProps> = () => {
  // Un seul onglet disponible : "Mesures & Statistiques"
  // Plus besoin de navigation entre onglets
  return (
    <View style={styles.container}>
      <View style={styles.singleTab}>
        <Ionicons 
          name="trending-up" 
          size={20} 
          color="#FFFFFF"
        />
        <Text style={styles.tabText}>
          Mesures & Statistiques
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  singleTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
});

export default ProgressTabs;

