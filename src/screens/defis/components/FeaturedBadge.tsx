import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../types';
import { getBadgeImage } from '../utils/defisUtils';

interface FeaturedBadgeProps {
  badge: Badge | null;
  onPress: (badge: Badge) => void;
}

const FeaturedBadge: React.FC<FeaturedBadgeProps> = ({ badge, onPress }) => {
  if (!badge) return null;

  const badgeImage = getBadgeImage(badge.name);
  const isLocked = !badge.isUnlocked && (badge as any).currentLevel === 0;
  const isAvailable = badge.isUnlocked || (badge as any).currentLevel > 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(badge)}
      activeOpacity={0.8}
    >
      <View style={styles.info}>
        {/* Badge et nom alignés ensemble */}
        <View style={styles.badgeHeader}>
          <View style={styles.iconContainer}>
            {badgeImage ? (
              <Image 
                source={badgeImage} 
                style={styles.icon}
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.iconPlaceholder, { backgroundColor: `${(badge as any).color || '#3B82F6'}20` }]}>
                <Ionicons name="trophy" size={64} color={(badge as any).color || '#3B82F6'} />
              </View>
            )}
            {(badge as any).currentLevel > 0 && (
              <View style={styles.levelIndicator}>
                <Text style={styles.levelIndicatorText}>{(badge as any).currentLevel}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.label}>Badge</Text>
            <Text style={styles.name}>
              {(badge as any).displayName || badge.name?.toUpperCase()}
            </Text>
            {isAvailable && (
              <TouchableOpacity style={styles.availableButton}>
                <Text style={styles.availableButtonText}>DISPONIBLE</Text>
                <View style={styles.availableDot} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Description qui prend tout l'espace en dessous */}
        <Text style={styles.description}>
          {badge.description || 'Description du badge'}
        </Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>
            Progression: {(badge as any).progressPercentage || 0}%
          </Text>
          <Text style={styles.stat}>
            Points gagnés: {(badge as any).totalPointsEarned || 0}
          </Text>
        </View>

        <View style={styles.progress}>
          <Text style={styles.levelText}>
            Niveau {(badge as any).currentLevel || 1}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(badge as any).progressPercentage || 0}%`,
                  backgroundColor: (badge as any).color || '#3B82F6',
                }
              ]} 
            />
          </View>
        </View>

        {isLocked && (
          <Text style={styles.lockMessage}>
            Badge verrouillé - complétez les badges précédents
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  info: {
    flex: 1,
  },
  badgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  icon: {
    width: 80,
    height: 80,
  },
  iconPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIndicator: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  availableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CAF50',
  },
  stats: {
    marginBottom: 12,
  },
  stat: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
    width: '100%',
  },
  progress: {
    marginBottom: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  lockMessage: {
    fontSize: 12,
    color: '#FF9800',
    fontStyle: 'italic',
    marginTop: 8,
  },
});

export default FeaturedBadge;

