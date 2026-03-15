import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { theme } from '../../constants/theme';
import Toast from 'react-native-toast-message';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_ASPECT_RATIO = 9 / 16;
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * VIDEO_ASPECT_RATIO);

export interface VideoBottomSheetProps {
  visible: boolean;
  videoId: string | null;
  onClose: () => void;
  /** Titre optionnel (ex. nom du plat) */
  title?: string;
}

const VideoBottomSheet: React.FC<VideoBottomSheetProps> = ({
  visible,
  videoId,
  onClose,
  title,
}) => {
  const insets = useSafeAreaInsets();
  const [playing, setPlaying] = useState(false);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
          )}
        </TouchableOpacity>

        <View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {Platform.OS === 'ios' ? (
            <BlurView intensity={40} style={styles.blurContainer}>
              <View style={styles.handle} />
              <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title || 'Vidéo'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                  <Ionicons name="close" size={26} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.videoWrapper}>
                {videoId ? (
                  <YoutubePlayer
                    height={VIDEO_HEIGHT}
                    width={SCREEN_WIDTH}
                    videoId={videoId}
                    play={playing}
                    onChangeState={(state) => {
                      if (state === 'playing') setPlaying(true);
                      if (state === 'paused' || state === 'ended') setPlaying(false);
                    }}
                    onError={() => {
                      Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: 'Impossible de charger la vidéo',
                      });
                    }}
                    webViewStyle={{ opacity: 0.99 }}
                    initialPlayerParams={{
                      autoplay: true,
                      cc_lang_pref: 'fr',
                      preventFullScreen: false,
                    }}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.placeholderText}>Aucune vidéo</Text>
                  </View>
                )}
              </View>
            </BlurView>
          ) : (
            <>
              <View style={styles.handle} />
              <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {title || 'Vidéo'}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={12}>
                  <Ionicons name="close" size={26} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.videoWrapper}>
                {videoId ? (
                  <YoutubePlayer
                    height={VIDEO_HEIGHT}
                    width={SCREEN_WIDTH}
                    videoId={videoId}
                    play={playing}
                    onChangeState={(state) => {
                      if (state === 'playing') setPlaying(true);
                      if (state === 'paused' || state === 'ended') setPlaying(false);
                    }}
                    onError={() => {
                      Toast.show({
                        type: 'error',
                        text1: 'Erreur',
                        text2: 'Impossible de charger la vidéo',
                      });
                    }}
                    webViewStyle={{ opacity: 0.99 }}
                    initialPlayerParams={{
                      autoplay: true,
                      cc_lang_pref: 'fr',
                      preventFullScreen: false,
                    }}
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="videocam-outline" size={48} color="#9CA3AF" />
                    <Text style={styles.placeholderText}>Aucune vidéo</Text>
                  </View>
                )}
              </View>
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
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 24,
  },
  blurContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  placeholderText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
});

export default VideoBottomSheet;
