import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

export const toastConfig = {
  error: ({ text1, text2, ...props }: BaseToastProps) => {
    return (
      <View style={styles.errorContainer}>
        {text1 && <Text style={styles.errorTitle}>{text1}</Text>}
        {text2 && <Text style={styles.errorMessage}>{text2}</Text>}
      </View>
    );
  },
  success: ({ text1, text2, ...props }: BaseToastProps) => {
    return (
      <View style={styles.successContainer}>
        {text1 && <Text style={styles.successTitle}>{text1}</Text>}
        {text2 && <Text style={styles.successMessage}>{text2}</Text>}
      </View>
    );
  },
  info: ({ text1, text2, ...props }: BaseToastProps) => {
    return (
      <View style={styles.infoContainer}>
        {text1 && <Text style={styles.infoTitle}>{text1}</Text>}
        {text2 && <Text style={styles.infoMessage}>{text2}</Text>}
      </View>
    );
  },
};

const styles = StyleSheet.create({
  errorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    minHeight: 60,
    maxHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  successMessage: {
    fontSize: 14,
    color: '#333333',
  },
  infoContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 20,
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  infoMessage: {
    fontSize: 14,
    color: '#333333',
  },
});
