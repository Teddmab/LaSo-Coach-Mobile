import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { ShimmerCard } from '../Shimmer';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NewsCardProps {
  news?: any[];
  loading?: boolean;
  onNewsPress?: (news: any) => void;
  onMarkComplete?: (contentId: string) => Promise<void>;
}

const NewsCard: React.FC<NewsCardProps> = ({ news, loading, onNewsPress, onMarkComplete }) => {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'dd MMM', { locale: fr });
    } catch {
      return '';
    }
  };

  const formatTime = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'HH:mm', { locale: fr });
    } catch {
      return '';
    }
  };

  // ✅ Fonction pour extraire l'ID YouTube et générer la couverture
  const getYouTubeThumbnail = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Ionicons name="newspaper" size={24} color="#FF5A1F" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>News</Text>
            <Text style={styles.subtitle}>Dernières actualités</Text>
          </View>
        </View>
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
          {news.map((item) => {
            const contentUrl = item.contentUrl || item.content?.contentUrl;
            const thumbnailUrl = item.thumbnailUrl || item.content?.thumbnailUrl;
            // ✅ Si c'est une vidéo YouTube, utiliser la couverture YouTube
            const youtubeThumbnail = getYouTubeThumbnail(contentUrl);
            const finalThumbnailUrl = youtubeThumbnail || thumbnailUrl;
            const title = item.title || item.content?.title || 'Actualité';
            const description = item.description || item.content?.description || '';
            const points = item.points || item.content?.points || 0;
            const assignedDate = item.assignedDate || item.content?.assignedDate;
            const formattedDate = formatDate(assignedDate);
            const formattedTime = formatTime(assignedDate);
            const hasVideo = !!youtubeThumbnail;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.newsCard, item.completed && styles.newsCardCompleted]}
                onPress={() => onNewsPress?.(item)}
                activeOpacity={0.7}
              >
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                  {finalThumbnailUrl ? (
                    <>
                      <Image
                        source={{ uri: finalThumbnailUrl }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                      {/* ✅ Badge vidéo YouTube */}
                      {hasVideo && (
                        <View style={styles.videoBadge}>
                          <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                        </View>
                      )}
                    </>
                  ) : (
                    <View style={styles.thumbnailPlaceholder}>
                      <Ionicons name="newspaper-outline" size={32} color="#FFFFFF" />
                    </View>
                  )}
                  {/* Points Badge */}
                  {points > 0 && (
                    <View style={styles.pointsBadge}>
                      <Ionicons name="star" size={12} color="#FFFFFF" />
                      <Text style={styles.pointsBadgeText}>+{points}</Text>
                    </View>
                  )}
                  {/* Completed Badge */}
                  {item.completed && (
                    <View style={styles.completedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.newsContent}>
                  {/* Date & Time */}
                  {(formattedDate || formattedTime) && (
                    <View style={styles.dateTimeContainer}>
                      {formattedDate && (
                        <View style={styles.dateTimeItem}>
                          <Ionicons name="calendar-outline" size={12} color={theme.colors.text.secondary} />
                          <Text style={styles.dateTimeText}>{formattedDate}</Text>
                        </View>
                      )}
                      {formattedTime && (
                        <View style={styles.dateTimeItem}>
                          <Ionicons name="time-outline" size={12} color={theme.colors.text.secondary} />
                          <Text style={styles.dateTimeText}>{formattedTime}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Title */}
                  <Text style={styles.newsTitle} numberOfLines={2}>
                    {title}
                  </Text>

                  {/* Description */}
                  {description && (
                    <Text style={styles.newsDescription} numberOfLines={2}>
                      {description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
    backgroundColor: '#FFF5F0',
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
    gap: 12,
  },
  newsCard: {
    width: 320, // ✅ Augmenté de 280 à 320 pour mieux étendre la carte
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newsCardCompleted: {
    opacity: 0.7,
  },
  thumbnailContainer: {
    width: '100%',
    height: 180, // ✅ Augmenté de 160 à 180 pour mieux afficher la couverture
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D6F5A7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  completedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 4,
  },
  // ✅ NOUVEAU: Badge pour indiquer que c'est une vidéo YouTube
  videoBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsContent: {
    padding: 12,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  newsDescription: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    lineHeight: 18,
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

