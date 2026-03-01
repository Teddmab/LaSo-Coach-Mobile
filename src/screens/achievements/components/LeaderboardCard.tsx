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
              {item.flag && (
                <View style={styles.flagContainer}>
                  <Text style={styles.flagEmoji}>{item.flag}</Text>
                </View>
              )}
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
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    marginBottom: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    marginRight: 10,
  },
  flagContainer: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  flagEmoji: {
    fontSize: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  userName: {
    fontSize: 15,
    color: '#2C3E50',
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  pointsContainer: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
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

