import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Challenge } from '../types';
import { getCategoryIcon, formatCategoryText, getValidationIcon } from '../../defis/utils/defisUtils';

interface ChallengeCardWithCompleteProps {
  challenge: Challenge;
  onAssign: (challengeId: string) => void;
  onLeave: (challengeId: string) => void;
  onComplete: (challenge: Challenge) => void;
}

const formatPoints = (points?: number): string => {
  if (!points) return '0';
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
};

const ChallengeCardWithComplete: React.FC<ChallengeCardWithCompleteProps> = ({
  challenge,
  onAssign,
  onLeave,
  onComplete,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{challenge.title}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>
              {formatPoints((challenge as any).rewards?.points || challenge.points || 0)}pts
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Catégorie : </Text>
          <Ionicons 
            name={getCategoryIcon(challenge.category) as any} 
            size={16} 
            color="#3B82F6" 
          />
          <Text style={[styles.detailValue, { color: '#424242', marginLeft: 8 }]}>
            {formatCategoryText(challenge.category)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Validation : </Text>
          <Ionicons 
            name={getValidationIcon(challenge.validationMode) as any} 
            size={16} 
            color="#10B981" 
          />
        </View>
        
        {(challenge as any).duration && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Durée : </Text>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={[styles.detailValue, { color: '#666' }]}>
              {(challenge as any).duration} jours
            </Text>
            <Ionicons name="hourglass-outline" size={16} color="#666" />
          </View>
        )}
      </View>
      
      {challenge.description && (
        <Text style={styles.description}>{challenge.description}</Text>
      )}
      
      {challenge.status === 'not_assigned' && (
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => onAssign(challenge.id)}
        >
          <Text style={styles.acceptButtonText}>Accepter le défi</Text>
        </TouchableOpacity>
      )}
      
      {(challenge.status === 'assigned' || challenge.status === 'in_progress') && (
        <View style={styles.assignedContainer}>
          {(challenge as any).progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(challenge as any).progress || 0}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>{(challenge as any).progress || 0}%</Text>
            </View>
          )}
          <View style={styles.assignedButtonsContainer}>
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={() => onComplete(challenge)}
            >
              <Text style={styles.completeButtonText}>Compléter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.leaveButton}
              onPress={() => onLeave(challenge.id)}
            >
              <Text style={styles.leaveButtonText}>Quitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {challenge.status === 'completed' && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
          <Text style={styles.completedText}>Complété</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
    marginRight: 12,
  },
  pointsBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pointsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7F8C8D',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
    lineHeight: 20,
  },
  acceptButton: {
    backgroundColor: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  assignedContainer: {
    marginTop: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  assignedButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  leaveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
    flex: 1,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  completedText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ChallengeCardWithComplete;

