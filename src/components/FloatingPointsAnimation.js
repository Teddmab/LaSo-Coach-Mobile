import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const FloatingPointsAnimation = ({ visible, points, reason }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (visible && points) {
      // Reset values
      translateY.setValue(0);
      opacity.setValue(0);
      scale.setValue(0.5);

      // Animate
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.delay(800),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    }
  }, [visible, points]);

  if (!visible || !points) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.floatingContainer,
          {
            opacity,
            transform: [
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <View style={styles.pointsContainer}>
          <Ionicons name="add-circle" size={24} color="#4CAF50" />
          <Text style={styles.pointsText}>{points}</Text>
        </View>
        {reason && (
          <Text style={styles.reasonText}>{reason}</Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: screenHeight / 2 - 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  floatingContainer: {
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 4,
  },
  reasonText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
});

export default FloatingPointsAnimation;

