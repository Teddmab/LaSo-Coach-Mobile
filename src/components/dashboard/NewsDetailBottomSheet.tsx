import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { theme } from '../../constants/theme';
import YoutubePlayer from 'react-native-youtube-iframe';
import { extractYouTubeVideoId, isLikelyYouTubeUrl } from '../../utils/youtubeUrl';
import {
  extractTikTokVideoIdFromUrl,
  getTikTokEmbedPageUrl,
  getTikTokOembedData,
  isTikTokUrl,
} from '../../utils/socialVideoUrl';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { stripHtmlToPlainText } from '../../utils/stripHtml';

interface NewsDetailBottomSheetProps {
  visible: boolean;
  news: any;
  onClose: () => void;
  onMarkComplete?: (contentId: string) => Promise<void>;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D1D1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#000',
    position: 'relative',
  },
  tiktokVideoContainer: {
    height: 420,
    backgroundColor: '#0a0a0a',
  },
  tiktokWebView: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  tiktokLoadingBox: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    gap: 8,
  },
  tiktokPlayLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  youtubeFallbackText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 12,
    lineHeight: 28,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  pointsText: {
    color: '#FFD700',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 20,
  },
  linkText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

type ArticleScrollProps = {
  hasYoutube: boolean;
  youtubeVideoId: string | null;
  playing: boolean;
  setPlaying: (v: boolean) => void;
  urlIsTikTok: boolean;
  tikTokVideoId: string | null;
  tikTokResolving: boolean;
  tikTokShowPlayer: boolean;
  setTikTokShowPlayer: (v: boolean) => void;
  previewThumb: string | null | undefined;
  title: string;
  author: string;
  formattedDate: string;
  formattedTime: string;
  points: number;
  description: string;
  rawContentUrl: string;
  contentUrlForLink?: string;
  handleOpenLink: (url: string) => void;
};

function NewsDetailArticleScroll({
  hasYoutube,
  youtubeVideoId,
  playing,
  setPlaying,
  urlIsTikTok,
  tikTokVideoId,
  tikTokResolving,
  tikTokShowPlayer,
  setTikTokShowPlayer,
  previewThumb,
  title,
  author,
  formattedDate,
  formattedTime,
  points,
  description,
  rawContentUrl,
  contentUrlForLink,
  handleOpenLink,
}: ArticleScrollProps) {
  const renderMedia = (): React.ReactNode => {
    if (hasYoutube && youtubeVideoId) {
      return (
        <View style={styles.videoContainer}>
          <YoutubePlayer
            height={220}
            videoId={youtubeVideoId}
            play={playing}
            onChangeState={(state) => {
              if (state === 'playing') setPlaying(true);
              if (state === 'paused' || state === 'ended') setPlaying(false);
            }}
            initialPlayerParams={{
              preventFullScreen: false,
              cc_lang_pref: 'fr',
              showClosedCaptions: true,
            }}
          />
          {!playing && (
            <TouchableOpacity
              style={styles.videoPlayOverlay}
              onPress={() => setPlaying(true)}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Lire la vidéo"
            >
              <Ionicons name="play-circle" size={64} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (urlIsTikTok && tikTokVideoId && tikTokShowPlayer) {
      return (
        <View style={[styles.videoContainer, styles.tiktokVideoContainer]}>
          <WebView
            source={{ uri: getTikTokEmbedPageUrl(tikTokVideoId) }}
            style={styles.tiktokWebView}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={Platform.OS === 'ios'}
            javaScriptEnabled
            domStorageEnabled
            allowsFullscreenVideo
            setSupportMultipleWindows={false}
            nestedScrollEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          />
        </View>
      );
    }

    if (urlIsTikTok && tikTokVideoId && !tikTokShowPlayer) {
      return (
        <View style={styles.videoContainer}>
          {previewThumb ? (
            <Image source={{ uri: previewThumb }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#111' }]} />
          )}
          <TouchableOpacity
            style={styles.videoPlayOverlay}
            onPress={() => setTikTokShowPlayer(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Lire la vidéo TikTok dans l'application"
          >
            <Ionicons name="musical-notes" size={56} color="#FFFFFF" />
            <Text style={styles.tiktokPlayLabel}>{"Lire dans l'application"}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (urlIsTikTok && tikTokResolving) {
      return (
        <View style={styles.tiktokLoadingBox}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ fontSize: 13, color: theme.colors.text.secondary }}>Préparation de la vidéo…</Text>
        </View>
      );
    }

    if (urlIsTikTok && !tikTokVideoId && !tikTokResolving) {
      return (
        <Text style={[styles.youtubeFallbackText, { marginBottom: 12 }]}>
          {"Impossible de lire cette vidéo TikTok dans l'application (lien non reconnu)."}
        </Text>
      );
    }

    if (previewThumb) {
      return <Image source={{ uri: previewThumb }} style={styles.thumbnail} resizeMode="cover" />;
    }

    return null;
  };

  const showGenericLink =
    !!contentUrlForLink &&
    !hasYoutube &&
    !urlIsTikTok &&
    !isLikelyYouTubeUrl(rawContentUrl);

  const showYoutubeError =
    !!contentUrlForLink && !hasYoutube && isLikelyYouTubeUrl(rawContentUrl) && !urlIsTikTok;

  return (
    <ScrollView
      style={styles.content}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {renderMedia()}

      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
          <Text style={styles.metaText}>{author}</Text>
        </View>
        {formattedDate ? (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>{formattedDate}</Text>
          </View>
        ) : null}
        {formattedTime ? (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.metaText}>{formattedTime}</Text>
          </View>
        ) : null}
        {points > 0 ? (
          <View style={styles.metaItem}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={[styles.metaText, styles.pointsText]}>+{points} pts</Text>
          </View>
        ) : null}
      </View>

      {description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{description}</Text>
        </View>
      ) : null}

      {showGenericLink ? (
        <TouchableOpacity style={styles.linkButton} onPress={() => handleOpenLink(contentUrlForLink!)}>
          <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.linkText}>Ouvrir le lien</Text>
        </TouchableOpacity>
      ) : null}

      {showYoutubeError ? (
        <Text style={styles.youtubeFallbackText}>
          {"Impossible de lire cette vidéo YouTube dans l'application (lien non reconnu)."}
        </Text>
      ) : null}
    </ScrollView>
  );
}

const NewsDetailBottomSheet: React.FC<NewsDetailBottomSheetProps> = ({
  visible,
  news,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  const [tikTokVideoId, setTikTokVideoId] = useState<string | null>(null);
  const [tikTokThumb, setTikTokThumb] = useState<string | null>(null);
  const [tikTokResolving, setTikTokResolving] = useState(false);
  const [tikTokShowPlayer, setTikTokShowPlayer] = useState(false);

  const rawContentUrl = (news?.contentUrl || news?.content?.contentUrl || '') as string;
  const youtubeVideoId = extractYouTubeVideoId(rawContentUrl || undefined);
  const hasYoutube = !!youtubeVideoId;
  const urlIsTikTok = !!rawContentUrl && isTikTokUrl(rawContentUrl) && !hasYoutube;

  useEffect(() => {
    if (visible && news) {
      setPlaying(false);
      setTikTokShowPlayer(false);
    }
  }, [visible, news?.id]);

  useEffect(() => {
    if (!visible || !urlIsTikTok || !rawContentUrl) {
      setTikTokVideoId(null);
      setTikTokThumb(null);
      setTikTokResolving(false);
      return;
    }
    const direct = extractTikTokVideoIdFromUrl(rawContentUrl);
    if (direct) {
      setTikTokVideoId(direct);
      setTikTokThumb(null);
      setTikTokResolving(false);
      return;
    }
    let cancelled = false;
    setTikTokResolving(true);
    setTikTokVideoId(null);
    setTikTokThumb(null);
    void getTikTokOembedData(rawContentUrl).then((d) => {
      if (cancelled) return;
      setTikTokVideoId(d.videoId);
      setTikTokThumb(d.thumbnailUrl);
      setTikTokResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, news?.id, urlIsTikTok, rawContentUrl]);

  if (!visible || !news) {
    return null;
  }

  const thumbnailUrl = news.thumbnailUrl || news.content?.thumbnailUrl;
  const previewThumb = urlIsTikTok ? tikTokThumb || thumbnailUrl : thumbnailUrl;
  const title = stripHtmlToPlainText(news.title || news.content?.title || '') || 'Actualité';
  const description = stripHtmlToPlainText(news.description || news.content?.description || '');
  const author = news.author || news.content?.creator?.name || 'Anonyme';
  const points = news.points || news.content?.points || 0;
  const assignedDate = news.assignedDate || news.content?.assignedDate;
  const formattedDate = assignedDate
    ? format(parseISO(assignedDate), 'EEEE dd MMMM yyyy', { locale: fr })
    : '';
  const formattedTime = assignedDate ? format(parseISO(assignedDate), 'HH:mm', { locale: fr }) : '';

  const handleOpenLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const scrollProps: ArticleScrollProps = {
    hasYoutube,
    youtubeVideoId,
    playing,
    setPlaying,
    urlIsTikTok,
    tikTokVideoId,
    tikTokResolving,
    tikTokShowPlayer,
    setTikTokShowPlayer,
    previewThumb,
    title,
    author,
    formattedDate,
    formattedTime,
    points,
    description,
    rawContentUrl,
    contentUrlForLink: news.contentUrl,
    handleOpenLink,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
          )}
        </TouchableOpacity>

        <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={20} style={styles.blurContainer}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Actualité</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <NewsDetailArticleScroll {...scrollProps} />
            </BlurView>
          ) : (
            <>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Actualité</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <NewsDetailArticleScroll {...scrollProps} />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default NewsDetailBottomSheet;
