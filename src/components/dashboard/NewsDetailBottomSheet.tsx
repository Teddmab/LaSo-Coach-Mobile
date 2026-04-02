import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import YoutubePlayer from 'react-native-youtube-iframe';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NewsDetailBottomSheetProps {
  visible: boolean;
  news: any;
  onClose: () => void;
  onMarkComplete?: (contentId: string) => Promise<void>;
}

const { width } = Dimensions.get('window');

const NewsDetailBottomSheet: React.FC<NewsDetailBottomSheetProps> = ({
  visible,
  news,
  onClose,
  onMarkComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);
  // ✅ RETIRÉ: marking state car le bouton "Ajouter à mon agenda" a été retiré

  if (!visible || !news) {
    return null;
  }

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(news.contentUrl || news.content?.contentUrl);
  const hasVideo = !!videoId;
  const thumbnailUrl = news.thumbnailUrl || news.content?.thumbnailUrl;
  const title = news.title || news.content?.title || 'Actualité';
  const description = news.description || news.content?.description || '';
  const author = news.author || news.content?.creator?.name || 'Anonyme';
  const points = news.points || news.content?.points || 0;
  const assignedDate = news.assignedDate || news.content?.assignedDate;
  const formattedDate = assignedDate 
    ? format(parseISO(assignedDate), 'EEEE dd MMMM yyyy', { locale: fr })
    : '';
  const formattedTime = assignedDate
    ? format(parseISO(assignedDate), 'HH:mm', { locale: fr })
    : '';

  // ✅ RETIRÉ: handleMarkComplete car le bouton "Ajouter à mon agenda" a été retiré

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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
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
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Actualité</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {/* Video/Image */}
                {hasVideo ? (
                  <View style={styles.videoContainer}>
                    <YoutubePlayer
                      height={220}
                      videoId={videoId}
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
                  </View>
                ) : thumbnailUrl ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Meta Info */}
                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.metaText}>{author}</Text>
                  </View>
                  {formattedDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                  )}
                  {formattedTime && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>{formattedTime}</Text>
                    </View>
                  )}
                  {points > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={[styles.metaText, styles.pointsText]}>+{points} pts</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{description}</Text>
                  </View>
                )}

                {/* Content URL Link */}
                {news.contentUrl && !hasVideo && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleOpenLink(news.contentUrl)}
                  >
                    <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.linkText}>Ouvrir le lien</Text>
                  </TouchableOpacity>
                )}

                {/* ✅ RETIRÉ: Le bouton "Ajouter à mon agenda" car les news sont déjà ajoutées par défaut */}
              </ScrollView>
            </BlurView>
          ) : (
            <>
              <View style={styles.handle} />
              
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Actualité</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
              >
                {/* Video/Image */}
                {hasVideo ? (
                  <View style={styles.videoContainer}>
                    <YoutubePlayer
                      height={220}
                      videoId={videoId}
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
                  </View>
                ) : thumbnailUrl ? (
                  <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : null}

                {/* Title */}
                <Text style={styles.title}>{title}</Text>

                {/* Meta Info */}
                <View style={styles.metaContainer}>
                  <View style={styles.metaItem}>
                    <Ionicons name="person-outline" size={16} color={theme.colors.text.secondary} />
                    <Text style={styles.metaText}>{author}</Text>
                  </View>
                  {formattedDate && (
                    <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>{formattedDate}</Text>
                    </View>
                  )}
                  {formattedTime && (
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.text.secondary} />
                      <Text style={styles.metaText}>{formattedTime}</Text>
                    </View>
                  )}
                  {points > 0 && (
                    <View style={styles.metaItem}>
                      <Ionicons name="star" size={16} color="#FFD700" />
                      <Text style={[styles.metaText, styles.pointsText]}>+{points} pts</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>{description}</Text>
                  </View>
                )}

                {/* Content URL Link */}
                {news.contentUrl && !hasVideo && (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => handleOpenLink(news.contentUrl)}
                  >
                    <Ionicons name="link-outline" size={20} color={theme.colors.primary} />
                    <Text style={styles.linkText}>Ouvrir le lien</Text>
                  </TouchableOpacity>
                )}

                {/* ✅ RETIRÉ: Le bouton "Ajouter à mon agenda" car les news sont déjà ajoutées par défaut */}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

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
  // ✅ RETIRÉ: Styles pour le bouton "Ajouter à mon agenda" car il a été retiré
});

export default NewsDetailBottomSheet;

