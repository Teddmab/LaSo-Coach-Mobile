import React, { useState } from 'react';
import { View, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../../constants/theme';
import { API_CONFIG } from '../../../config/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  postId: string;
  images: string[];
  onImagePress?: (index: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ postId, images, onImagePress }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

  // Construire l'URL complète comme dans la version web
  const getImageUrl = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    
    // Si l'URL commence par /uploads/, c'est une URL relative
    // Si l'URL contient déjà le domaine S3, c'est une URL complète
    if (url.includes('amazonaws.com') || url.includes('s3.')) {
      // URL S3 complète
      return url.startsWith('http') ? url : `https:${url}`;
    }
    
    // URL relative du backend
    const baseUrl = API_CONFIG.BASE_URL || '';
    const rootUrl = baseUrl.replace('/api/v1', '');
    const fullUrl = `${rootUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    
    return fullUrl;
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.carousel}
      >
        {images.map((imageUri, index) => {
          const fullUrl = getImageUrl(imageUri);
          if (!fullUrl) return null;
          
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.9}
              onPress={() => onImagePress && onImagePress(index)}
            >
              <Image
                source={{ uri: fullUrl }}
                style={styles.image}
                resizeMode="cover"
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.indicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex ? styles.indicatorActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    position: 'relative',
    marginHorizontal: -16, // Pour que l'image prenne toute la largeur
  },
  carousel: {
    width: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    resizeMode: 'cover',
    backgroundColor: '#E4E6EB',
  },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ImageCarousel;

