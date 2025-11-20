import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Avatar = ({ 
  source, 
  size = 40, 
  style, 
  showBorder = false,
  fallbackText = null 
}) => {
  const uri = source?.uri;
  const isString = typeof uri === 'string';
  const trimmed = isString ? uri.trim() : '';
  const invalidPlaceholders = ['https://via.placeholder.com/40', 'null', 'undefined', ''];
  const hasValidAvatar = !!trimmed && !invalidPlaceholders.includes(trimmed);
  
  if (hasValidAvatar) {
    return (
      <Image
        source={source}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          showBorder && styles.avatarBorder,
          style
        ]}
        resizeMode="cover"
      />
    );
  }

  // Fallback to placeholder
  return (
    <View
      style={[
        styles.placeholderContainer,
        { width: size, height: size, borderRadius: size / 2 },
        showBorder && styles.avatarBorder,
        style
      ]}
    >
      {fallbackText ? (
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>
          {fallbackText}
        </Text>
      ) : (
        <Ionicons 
          name="person" 
          size={size * 0.5} 
          color="#666" 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  placeholderContainer: {
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  fallbackText: {
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
});

export default Avatar;
