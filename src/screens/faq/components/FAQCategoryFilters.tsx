import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface FAQCategoryFiltersProps {
  categories: string[];
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  getCategoryCount: (category: string) => number;
}

const FAQCategoryFilters: React.FC<FAQCategoryFiltersProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  getCategoryCount,
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {categories.map(category => {
        const count = getCategoryCount(category);
        const isSelected = selectedCategory === category;
        
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.button,
              isSelected && styles.buttonActive
            ]}
            onPress={() => onCategorySelect(category)}
          >
            <Ionicons
              name="help-circle-outline"
              size={18}
              color={isSelected ? '#FFFFFF' : '#FF9800'}
              style={styles.icon}
            />
            <Text style={[
              styles.text,
              isSelected && styles.textActive
            ]}>
              {category === 'ALL' ? 'Toutes les catégories' : category}
            </Text>
            <View style={[
              styles.badge,
              isSelected && styles.badgeActive
            ]}>
              <Text style={[
                styles.badgeText,
                isSelected && styles.badgeTextActive
              ]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  content: {
    paddingRight: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
  },
  buttonActive: {
    backgroundColor: theme.colors.primary,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: 8,
  },
  textActive: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});

export default FAQCategoryFilters;

