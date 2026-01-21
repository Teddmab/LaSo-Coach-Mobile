import React, { useMemo } from 'react';
import { Image, ImageProps, StyleSheet, View } from 'react-native';

interface ImagePersistentProps extends ImageProps {
  source: any;
  fallbackSource?: any;
}

/**
 * Composant Image qui garde l'image en mémoire même quand elle n'est pas visible
 * Évite la disparition des images lors des re-renders
 */
const ImagePersistent: React.FC<ImagePersistentProps> = ({ 
  source, 
  fallbackSource,
  style,
  ...props 
}) => {
  // Mémoriser la source pour éviter les re-renders inutiles
  const memoizedSource = useMemo(() => {
    if (typeof source === 'object' && source.uri) {
      // Image distante
      return source;
    }
    // Image locale
    return source;
  }, [source]);

  return (
    <Image
      source={memoizedSource}
      style={style}
      defaultSource={fallbackSource}
      {...props}
    />
  );
};

export default ImagePersistent;

