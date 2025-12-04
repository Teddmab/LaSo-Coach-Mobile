import React from 'react';
import { View, Text, Image, StyleSheet, ImageSourcePropType, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AvatarProps {
  source?: ImageSourcePropType;
  size?: number;
  style?: ViewStyle | ImageStyle;
  showBorder?: boolean;
  fallbackText?: string | null;
}

const Avatar: React.FC<AvatarProps> = ({ 
  source, 
  size = 40, 
  style, 
  showBorder = false,
  fallbackText = null 
}) => {
  const uri = (source as any)?.uri;
  const isString = typeof uri === 'string';
  const trimmed = isString ? uri.trim() : '';
  const invalidPlaceholders = ['https://via.placeholder.com/40', 'null', 'undefined', ''];
  const hasValidAvatar = !!trimmed && !invalidPlaceholders.includes(trimmed);
  
  if (hasValidAvatar) {
    return (
      <Image
        source={source!}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          showBorder && styles.avatarBorder,
          style as ImageStyle
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
          color="#999" 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E0E0E0',
  },
  placeholderContainer: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: '#666',
    fontWeight: '600',
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
});

export default Avatar;

