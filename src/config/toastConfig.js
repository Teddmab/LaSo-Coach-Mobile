import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const toastConfig = {
  error: ({ text1, text2, ...props }) => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>{text1}</Text>
      {text2 && <Text style={styles.errorMessage}>{text2}</Text>}
    </View>
  ),
  success: ({ text1, text2, ...props }) => (
    <View style={styles.successContainer}>
      <Text style={styles.successTitle}>{text1}</Text>
      {text2 && <Text style={styles.successMessage}>{text2}</Text>}
    </View>
  ),
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 15,
    margin: 20,
    minHeight: 60,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    margin: 20,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  successMessage: {
    fontSize: 14,
    color: '#FFFFFF',
  },
});
