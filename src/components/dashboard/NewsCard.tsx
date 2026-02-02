import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import AgoraContentCard from './AgoraContentCard';
import { ShimmerCard } from '../Shimmer';

interface NewsCardProps {
  news?: any[];
  loading?: boolean;
  onNewsPress?: (news: any) => void;
  onMarkComplete?: (contentId: string) => Promise<void>;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, loading, onNewsPress, onMarkComplete }) => {
  const handleCardPress = () => {
    if (onNewsPress && news && news.length > 0) {
      onNewsPress(news[0]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Ionicons name="newspaper-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Actualités</Text>
            <Text style={styles.subtitle}>Restez informé</Text>
          </View>
        </View>
        {news && news.length > 0 && (
          <TouchableOpacity onPress={handleCardPress}>
            <Ionicons name="arrow-forward-circle" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ShimmerCard />
        </View>
      ) : news && news.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.newsContainer}
        >
          {news.map((item) => (
            <AgoraContentCard
              key={item.id}
              content={item}
              onPress={() => onNewsPress?.(item)}
              onMarkComplete={onMarkComplete}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="newspaper-outline" size={48} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>Aucune actualité disponible</Text>
          <Text style={styles.emptyText}>
            Les dernières actualités et nouveautés apparaîtront ici
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  newsContainer: {
    paddingRight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default NewsCard;

