import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Composant Shimmer - Effet de chargement avec animation
 * Utilisé pour remplacer les ActivityIndicator
 */
const Shimmer: React.FC<ShimmerProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    shimmer.start();

    return () => shimmer.stop();
  }, [shimmerAnimation]);

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity,
            borderRadius,
          },
        ]}
      />
    </View>
  );
};

/**
 * Composant ShimmerCard - Carte avec effet shimmer
 */
export const ShimmerCard: React.FC<{ style?: any }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Shimmer width="60%" height={20} style={styles.cardTitle} />
    <Shimmer width="100%" height={16} style={styles.cardLine} />
    <Shimmer width="80%" height={16} style={styles.cardLine} />
    <Shimmer width="90%" height={16} style={styles.cardLine} />
  </View>
);

/**
 * Composant ShimmerList - Liste avec effet shimmer
 */
export const ShimmerList: React.FC<{ count?: number; itemHeight?: number }> = ({
  count = 3,
  itemHeight = 80,
}) => (
  <View style={styles.list}>
    {Array.from({ length: count }).map((_, index) => (
      <View key={index} style={[styles.listItem, { height: itemHeight }]}>
        <Shimmer width={60} height={60} borderRadius={30} style={styles.listItemAvatar} />
        <View style={styles.listItemContent}>
          <Shimmer width="70%" height={18} style={styles.listItemTitle} />
          <Shimmer width="100%" height={14} style={styles.listItemLine} />
          <Shimmer width="60%" height={14} style={styles.listItemLine} />
        </View>
      </View>
    ))}
  </View>
);

/**
 * Composant ShimmerGrid - Grille avec effet shimmer
 */
export const ShimmerGrid: React.FC<{ columns?: number; count?: number }> = ({
  columns = 2,
  count = 4,
}) => (
  <View style={[styles.grid, { flexDirection: 'row', flexWrap: 'wrap' }]}>
    {Array.from({ length: count }).map((_, index) => (
      <View
        key={index}
        style={[
          styles.gridItem,
          {
            width: `${100 / columns - 2}%`,
            margin: '1%',
          },
        ]}
      >
        <Shimmer width="100%" height={120} borderRadius={12} />
        <Shimmer width="80%" height={16} style={styles.gridItemTitle} />
        <Shimmer width="60%" height={14} style={styles.gridItemSubtitle} />
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E0E0E0',
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    marginBottom: 12,
  },
  cardLine: {
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  listItemAvatar: {
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    marginBottom: 8,
  },
  listItemLine: {
    marginTop: 6,
  },
  grid: {
    padding: 16,
  },
  gridItem: {
    marginBottom: 16,
  },
  gridItemTitle: {
    marginTop: 8,
  },
  gridItemSubtitle: {
    marginTop: 6,
  },
});

export default Shimmer;

