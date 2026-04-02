import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { BadgeSummary } from '../types';

interface SummaryCardProps {
  summary: BadgeSummary | null;
}

const formatPoints = (points: number): string => {
  if (!points) return '0';
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
};

const SummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  if (!summary) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="trophy" size={24} color="#FFD700" />
        <Text style={styles.title}>Vos progrès</Text>
      </View>
      
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{summary.badgesUnlocked || 0}</Text>
          <Text style={styles.statLabel}>Badges débloqués</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatPoints(summary.totalPointsEarned || 0)}</Text>
          <Text style={styles.statLabel}>Points totaux</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {(summary as any).overallProgressPercentage || 0}%
          </Text>
          <Text style={styles.statLabel}>Progression</Text>
        </View>
      </View>
      
      {/* Overall Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { 
                width: `${(summary as any).overallProgressPercentage || 0}%`,
                backgroundColor: theme.colors.primary,
              }
            ]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  progressContainer: {
    marginTop: 8,
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
});

export default SummaryCard;

