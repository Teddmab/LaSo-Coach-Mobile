import React, { useState } from 'react';
import { View, ScrollView, Image, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  postId: string;
  images: string[];
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ postId, images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) return null;

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
        {images.map((imageUri, index) => (
          <Image
            key={index}
            source={{ uri: imageUri }}
            style={styles.image}
          />
        ))}
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
  },
  carousel: {
    width: SCREEN_WIDTH,
  },
  image: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    resizeMode: 'cover',
    backgroundColor: theme.colors.background,
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

