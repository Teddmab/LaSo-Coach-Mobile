import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '../types';
import { getBadgeImage } from '../utils/defisUtils';

interface BadgeDetailModalProps {
  visible: boolean;
  badge: Badge | null;
  onClose: () => void;
}

const BadgeDetailModal: React.FC<BadgeDetailModalProps> = ({
  visible,
  badge,
  onClose,
}) => {
  if (!badge) return null;

  const badgeImage = getBadgeImage(badge.name);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Détails du badge</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.body}>
            {/* Badge Header */}
            <View style={styles.badgeHeader}>
              <View style={[styles.iconContainer, { backgroundColor: `${(badge as any).color || '#3B82F6'}20` }]}>
                {badgeImage ? (
                  <Image 
                    source={badgeImage} 
                    style={styles.icon}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="trophy" size={48} color={(badge as any).color || '#3B82F6'} />
                )}
              </View>
              <Text style={styles.name}>
                {(badge as any).displayName || badge.name}
              </Text>
              <Text style={styles.level}>
                Niveau {(badge as any).currentLevel || 0}
              </Text>
              <Text style={styles.description}>{badge.description}</Text>
            </View>
            
            {/* Progress Section */}
            <View style={styles.progress}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progression</Text>
                <Text style={styles.progressValue}>
                  {(badge as any).totalPointsEarned || 0} / {(badge as any).totalPointsRequired || 0} points
                </Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${(badge as any).progressPercentage || 0}%`,
                      backgroundColor: (badge as any).color || '#3B82F6',
                    }
                  ]} 
                />
              </View>
            </View>
            
            {/* Levels List */}
            {(badge as any).levels && (badge as any).levels.length > 0 && (
              <View style={styles.levels}>
                <Text style={styles.levelsTitle}>Niveaux</Text>
                {(badge as any).levels.map((level: any, index: number) => (
                  <View key={index} style={styles.levelItem}>
                    <View style={styles.levelItemHeader}>
                      <Text style={styles.levelItemNumber}>Niveau {level.level}</Text>
                      {level.isUnlocked ? (
                        <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      ) : (
                        <Ionicons name="lock-closed" size={20} color="#CCC" />
                      )}
                    </View>
                    <Text style={styles.levelItemDescription}>{level.description}</Text>
                    <Text style={styles.levelItemPoints}>
                      {level.pointsEarned || 0} / {level.pointsRequired || 0} points
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  body: {
    padding: 20,
  },
  badgeHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  level: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
  progress: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  progressValue: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  levels: {
    marginTop: 8,
  },
  levelsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  levelItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  levelItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelItemNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  levelItemDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    lineHeight: 20,
  },
  levelItemPoints: {
    fontSize: 12,
    color: '#7F8C8D',
  },
});

export default BadgeDetailModal;

