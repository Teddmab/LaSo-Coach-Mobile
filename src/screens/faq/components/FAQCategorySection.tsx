import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { FAQ } from '../types';
import FAQItem from './FAQItem';

interface FAQCategorySectionProps {
  category: string;
  items: FAQ[];
  expandedItems: Record<string, boolean>;
  onToggleItem: (faqId: string) => void;
}

const FAQCategorySection: React.FC<FAQCategorySectionProps> = ({
  category,
  items,
  expandedItems,
  onToggleItem,
}) => {
  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="help-circle-outline"
          size={20}
          color="#FF9800"
          style={styles.icon}
        />
        <Text style={styles.title}>{category}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{items.length}</Text>
        </View>
      </View>
      {items.map(faq => (
        <FAQItem
          key={faq.id}
          faq={faq}
          isExpanded={!!expandedItems[faq.id]}
          onToggle={() => onToggleItem(faq.id)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
  },
  badge: {
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});

export default FAQCategorySection;

