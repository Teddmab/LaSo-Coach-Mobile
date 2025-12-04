import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

const FAQEmptyState: React.FC = () => {
  return (
    <View style={styles.container}>
      <Ionicons name="help-circle-outline" size={48} color={theme.colors.text.secondary} />
      <Text style={styles.text}>Aucune question trouvée</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  text: {
    fontSize: 16,
    color: theme.colors.text.secondary,
    marginTop: 16,
  },
});

export default FAQEmptyState;

