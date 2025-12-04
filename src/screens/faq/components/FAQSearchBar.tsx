import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface FAQSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FAQSearchBar: React.FC<FAQSearchBarProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={20} color={theme.colors.text.secondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder="Rechercher une question..."
        placeholderTextColor={theme.colors.text.secondary}
        value={searchQuery}
        onChangeText={onSearchChange}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
});

export default FAQSearchBar;

