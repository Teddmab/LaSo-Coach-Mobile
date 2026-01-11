import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface CircularProgressProps {
  size?: number;
  progress?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  initial?: number;
  current?: number;
  target?: number;
  unit?: string;
  label?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
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
          {current !== undefined && target !== undefined ? (
            <>
              <Text style={[styles.valueText, { fontSize: size * 0.2 }]}>
                {current.toFixed(1)}
              </Text>
              {unit && (
                <Text style={[styles.unitText, { fontSize: size * 0.1 }]}>
                  {unit}
                </Text>
              )}
              {target && (
                <Text style={[styles.targetText, { fontSize: size * 0.08 }]}>
                  / {typeof target === 'number' ? target.toFixed(1) : target}
                </Text>
              )}
            </>
          ) : (
            <Text style={[styles.progressText, { fontSize: size * 0.15 }]}>
              {Math.round(progress)}%
            </Text>
          )}
        </View>
      </View>
      
      {/* Label */}
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundRing: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  progressRing: {
    position: 'absolute',
    borderStyle: 'solid',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  unitText: {
    color: theme.colors.text.secondary,
    marginTop: -2,
  },
  targetText: {
    color: theme.colors.text.secondary,
  },
  progressText: {
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});

export default CircularProgress;

