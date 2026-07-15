import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../types';
import { getBadgeImage } from '../utils/defisUtils';

interface BadgeGridProps {
  badges: Badge[];
  onBadgePress: (badge: Badge) => void;
}

const BadgeGrid: React.FC<BadgeGridProps> = ({ badges, onBadgePress }) => {
  const renderBadgeItem = (badge: Badge, index: number) => {
    const badgeImage = getBadgeImage(badge.name);
    const isLocked = !badge.isUnlocked && (badge as any).currentLevel === 0;

    return (
      <TouchableOpacity
        key={badge.id || index}
        style={styles.item}
        onPress={() => onBadgePress(badge)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {badgeImage ? (
            <Image 
              source={badgeImage} 
              style={[styles.icon, isLocked && styles.iconLocked]}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.iconPlaceholder, { backgroundColor: `${(badge as any).color || '#3B82F6'}20` }]}>
              <Ionicons 
                name="trophy" 
                size={40} 
                color={isLocked ? '#CCC' : ((badge as any).color || '#3B82F6')} 
              />
            </View>
          )}
          
          {isLocked ? (
            <View style={styles.lock}>
              <Ionicons name="lock-closed" size={16} color="#FF9800" />
            </View>
          ) : (badge as any).currentLevel > 0 ? (
            <View style={styles.level}>
              <Text style={styles.levelText}>{(badge as any).currentLevel}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.name, isLocked && styles.nameLocked]}>
          {(badge as any).displayName || badge.name}
        </Text>
      </TouchableOpacity>
    );
  };

  // Arrange badges in grid: 4 per row
  const rows: any[][] = [];
  for (let i = 0; i < badges.length; i += 4) {
    const rowItems = badges.slice(i, i + 4);
    rows.push(rowItems);
  }

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((badge, colIndex) => renderBadgeItem(badge, rowIndex * 4 + colIndex))}
          {rowIndex === rows.length - 1 && row.length < 4 && (
            Array.from({ length: 4 - row.length }).map((_, emptyIndex) => (
              <View key={`empty-${emptyIndex}`} style={styles.item} />
            ))
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  item: {
    width: '22%',
    alignItems: 'center',
    minWidth: 70,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  icon: {
    width: 64,
    height: 64,
  },
  iconLocked: {
    opacity: 0.5,
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  level: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 12,
    color: '#2C3E50',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  nameLocked: {
    color: '#CCC',
  },
});

export default BadgeGrid;

