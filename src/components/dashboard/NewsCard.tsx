import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  LayoutChangeEvent,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../constants/theme';
import { extractYouTubeVideoId, youtubeThumbnailFromVideoId } from '../../utils/youtubeUrl';
import { getTikTokThumbnailUrl, isTikTokUrl } from '../../utils/socialVideoUrl';
import { ShimmerCard } from '../Shimmer';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { stripHtmlToPlainText } from '../../utils/stripHtml';

interface NewsCardProps {
  news?: any[];
  loading?: boolean;
  onNewsPress?: (news: any) => void;
  onMarkComplete?: (contentId: string) => Promise<void>;
}

/** Marges carte News : marginHorizontal 20 + paddingHorizontal 20 de chaque côté */
const NEWS_CARD_HORIZONTAL_INSET = 80;

const NewsCard: React.FC<NewsCardProps> = ({ news, loading, onNewsPress }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [sliderLayoutWidth, setSliderLayoutWidth] = useState(0);
  const [tikTokThumbs, setTikTokThumbs] = useState<Record<string, string>>({});

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

  const newsCount = news?.length ?? 0;

  const pageWidth =
    sliderLayoutWidth > 0
      ? sliderLayoutWidth
      : Math.max(280, windowWidth - NEWS_CARD_HORIZONTAL_INSET);

  const onScrollViewLayout = useCallback((e: LayoutChangeEvent) => {
    setSliderLayoutWidth(e.nativeEvent.layout.width);
  }, []);

  const newsSignature = useMemo(
    () =>
      (news ?? [])
        .map((n) => `${n.id}:${String(n.contentUrl || n.content?.contentUrl || '')}`)
        .join('|'),
    [news]
  );

  useEffect(() => {
    if (!news?.length) return;
    let cancelled = false;

    const loadTikTokThumbs = async (): Promise<void> => {
      const urls = new Set<string>();
      for (const item of news) {
        const u = String(item.contentUrl || item.content?.contentUrl || '').trim();
        if (u && isTikTokUrl(u)) urls.add(u);
      }
      for (const url of urls) {
        if (cancelled) return;
        const thumb = await getTikTokThumbnailUrl(url);
        if (cancelled || !thumb) continue;
        setTikTokThumbs((prev) => (prev[url] ? prev : { ...prev, [url]: thumb }));
      }
    };

    void loadTikTokThumbs();
    return () => {
      cancelled = true;
    };
  }, [newsSignature]);

  const countLabel = useMemo(() => {
    if (newsCount === 0) return '';
    if (newsCount === 1) return '1 actualité';
    return `${newsCount} actualités`;
  }, [newsCount]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconWrapper}>
            <Ionicons name="newspaper" size={24} color="#FF5A1F" />
          </View>
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>News</Text>
              {!loading && newsCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{newsCount}</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              {loading ? 'Chargement…' : newsCount > 0 ? countLabel : 'Dernières actualités'}
            </Text>
          </View>
        </View>
      </View>

      {!loading && newsCount > 1 && (
        <View style={styles.scrollHintRow}>
          <Ionicons name="swap-horizontal" size={14} color={theme.colors.text.secondary} />
          <Text style={styles.scrollHintText}>Glissez vers la gauche pour parcourir</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ShimmerCard />
        </View>
      ) : news && news.length > 0 ? (
        <View style={styles.scrollOuter}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newsContainer}
            onLayout={onScrollViewLayout}
          >
            {news.map((item) => {
              const contentUrl = item.contentUrl || item.content?.contentUrl;
              const urlStr = String(contentUrl || '').trim();
              const thumbnailUrl = item.thumbnailUrl || item.content?.thumbnailUrl;
              const youtubeId = extractYouTubeVideoId(contentUrl);
              const tikTok = urlStr && isTikTokUrl(urlStr) && !youtubeId;
              const youtubeThumbnail = youtubeId ? youtubeThumbnailFromVideoId(youtubeId) : null;
              const tikThumb = tikTok && tikTokThumbs[urlStr] ? tikTokThumbs[urlStr] : null;
              const finalThumbnailUrl = youtubeThumbnail || tikThumb || thumbnailUrl;
              const title =
                stripHtmlToPlainText(item.title || item.content?.title || '') || 'Actualité';
              const description = stripHtmlToPlainText(
                item.description || item.content?.description || ''
              );
              const points = item.points || item.content?.points || 0;
              const assignedDate = item.assignedDate || item.content?.assignedDate;
              const formattedDate = formatDate(assignedDate);
              const formattedTime = formatTime(assignedDate);
              const hasYoutube = !!youtubeId;
              const hasTikTok = tikTok;

              return (
                <View key={item.id} style={[styles.pageSlide, { width: pageWidth }]}>
                <TouchableOpacity
                  style={[
                    styles.newsCard,
                    item.completed && styles.newsCardCompleted,
                  ]}
                  onPress={() => onNewsPress?.(item)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.thumbnailContainer,
                      hasTikTok && styles.thumbnailContainerTikTok,
                    ]}
                  >
                    {finalThumbnailUrl ? (
                      <>
                        <Image
                          source={{ uri: finalThumbnailUrl }}
                          style={styles.thumbnail}
                          resizeMode="cover"
                        />
                        {hasYoutube && (
                          <View style={[styles.videoBadge, styles.videoBadgeYoutube]}>
                            <Ionicons name="logo-youtube" size={22} color="#FFFFFF" />
                          </View>
                        )}
                        {hasTikTok && (
                          <View style={[styles.videoBadge, styles.videoBadgeTikTok]}>
                            <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
                          </View>
                        )}
                      </>
                    ) : hasTikTok ? (
                      <LinearGradient
                        colors={['#010101', '#25F4EE', '#FE2C55', '#010101']}
                        locations={[0, 0.35, 0.65, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.tiktokPlaceholder}
                      >
                        <Ionicons name="musical-notes" size={36} color="#FFFFFF" />
                        <Text style={styles.tiktokPlaceholderLabel}>TikTok</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <Ionicons name="newspaper-outline" size={32} color="#FFFFFF" />
                      </View>
                    )}
                    {hasTikTok && (
                      <View style={styles.tiktokRibbon}>
                        <Text style={styles.tiktokRibbonText}>Aperçu TikTok</Text>
                      </View>
                    )}
                    {points > 0 && (
                      <View style={styles.pointsBadge}>
                        <Ionicons name="star" size={12} color="#FFFFFF" />
                        <Text style={styles.pointsBadgeText}>+{points}</Text>
                      </View>
                    )}
                    {item.completed && (
                      <View style={styles.completedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={[styles.newsContent, hasTikTok && styles.newsContentTikTok]}>
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

                    <Text style={[styles.newsTitle, hasTikTok && styles.newsTitleTikTok]} numberOfLines={hasTikTok ? 3 : 2}>
                      {title}
                    </Text>

                    {description && !hasTikTok && (
                      <Text style={styles.newsDescription} numberOfLines={2}>
                        {description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
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
    marginBottom: 8,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  countBadge: {
    minWidth: 26,
    height: 26,
    paddingHorizontal: 8,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  scrollHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F6FA',
    borderRadius: 10,
    alignSelf: 'stretch',
  },
  scrollHintText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 20,
  },
  scrollOuter: {
    position: 'relative',
  },
  newsContainer: {
    flexGrow: 1,
  },
  pageSlide: {
    flexShrink: 0,
  },
  newsCard: {
    flex: 1,
    width: '100%',
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
    height: 168,
    position: 'relative',
    backgroundColor: '#E8E8E8',
  },
  thumbnailContainerTikTok: {
    height: 248,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E8E8E8',
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
  tiktokPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tiktokPlaceholderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tiktokRibbon: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tiktokRibbonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
  videoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    borderRadius: 20,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoBadgeYoutube: {
    backgroundColor: 'rgba(255, 0, 0, 0.88)',
  },
  videoBadgeTikTok: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  newsContent: {
    padding: 12,
  },
  newsContentTikTok: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 88,
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
  newsTitleTikTok: {
    fontSize: 14,
    lineHeight: 19,
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
