import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { FAQ } from '../types';

interface FAQItemProps {
  faq: FAQ;
  isExpanded: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ faq, isExpanded, onToggle }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.question}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{faq.question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answer}>
          <Text style={styles.answerText}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text.primary,
    marginRight: 12,
  },
  answer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answerText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    lineHeight: 22,
    marginTop: 12,
  },
});

export default FAQItem;

