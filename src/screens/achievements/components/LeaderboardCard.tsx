import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../../../components/Avatar';
import { LeaderboardUser } from '../types';
import { formatPoints } from '../utils/achievementsUtils';
import { ShimmerList } from '../../../components/Shimmer';

interface LeaderboardCardProps {
  title: string;
  icon: string;
  iconColor: string;
  users: LeaderboardUser[];
  loading?: boolean;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  title,
  icon,
  iconColor,
  users,
  loading = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name={icon as any} size={20} color={iconColor} />
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ShimmerList count={5} itemHeight={60} />
        </View>
      ) : users.length > 0 ? (
        users.map((item, index) => (
          <View key={index} style={styles.item}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>{item.rank}</Text>
            </View>
            
            <View style={styles.userInfo}>
              <Avatar 
                source={item.avatar ? { uri: item.avatar } : undefined} 
                size={32}
                style={styles.avatar}
                fallbackText={item.name?.charAt(0)}
              />
              {item.flag && <Text style={styles.flagEmoji}>{item.flag}</Text>}
              <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            </View>
            
            <View style={styles.pointsContainer}>
              <Text style={styles.pointsText}>{formatPoints(item.points)}pts</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aucun classement disponible</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
  pointsContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
});

export default LeaderboardCard;

