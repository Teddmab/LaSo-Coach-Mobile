import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

const CircularProgress = ({ 
  size = 100, 
  progress = 0, 
  strokeWidth = 8, 
  color = theme.colors.primary,
  backgroundColor = '#E5E7EB',
  initial,
  current,
  target,
  unit,
  label
}) => {
  return (
    <View style={styles.container}>
      {/* Circular Progress */}
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <View 
          style={[
            styles.backgroundRing, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor
            }
          ]} 
        />
        
        {/* Progress overlay - simplified for now */}
        <View 
          style={[
            styles.progressRing, 
            { 
              width: size - strokeWidth * 2, 
              height: size - strokeWidth * 2, 
              borderRadius: (size - strokeWidth * 2) / 2,
              borderWidth: strokeWidth / 2,
              borderColor: color,
              borderTopColor: color,
              borderRightColor: progress > 25 ? color : backgroundColor,
              borderBottomColor: progress > 50 ? color : backgroundColor,
              borderLeftColor: progress > 75 ? color : backgroundColor,
            }
          ]} 
        />
        
        {/* Center Content */}
        <View style={styles.centerContent}>
          <Text style={[styles.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>{current}{unit}</Text>
        </View>
      </View>
      
      {/* Labels */}
      <View style={styles.labels}>
        <View style={styles.labelRow}>
          <Text style={styles.initialLabel}>{initial}{unit}</Text>
          <Text style={styles.targetLabel}>{target}{unit}</Text>
        </View>
        <Text style={styles.mainLabel}>{label}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  circle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundRing: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  unit: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: -4,
  },
  labels: {
    alignItems: 'center',
    marginTop: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 110,
    marginBottom: 4,
  },
  initialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.secondary,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8BC34A',
  },
  mainLabel: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default CircularProgress; 