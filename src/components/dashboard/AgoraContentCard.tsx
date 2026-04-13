import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { stripHtmlToPlainText } from '../../utils/stripHtml';
import YoutubePlayer from 'react-native-youtube-iframe';

const AgoraContentCard = ({ content, onMarkComplete, onPress }) => {
  const [playing, setPlaying] = useState(false);

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYouTubeVideoId(content.contentUrl);
  const hasVideo = !!videoId;

  const handleMarkComplete = () => {
    if (onMarkComplete) {
      onMarkComplete(content.id);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress(content);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, content.completed && styles.cardCompleted]} 
      onPress={handlePress}
    >
      {/* Thumbnail/Video */}
      <View style={styles.thumbnailContainer}>
        {hasVideo ? (
          <View style={styles.videoContainer}>
            <YoutubePlayer
              height={120}
              videoId={videoId}
              play={playing}
              initialPlayerParams={{
                preventFullScreen: true,
                cc_lang_pref: "us",
                showClosedCaptions: true
              }}
            />
          </View>
        ) : content.thumbnailUrl ? (
          <Image 
            source={{ uri: content.thumbnailUrl }} 
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: '#20B2AA' }]}>
            <Ionicons name="notifications" size={24} color="#FFFFFF" />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.author}>{content.author || 'Anonyme'}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {stripHtmlToPlainText(content.title || '') || 'Nouvelle actualité'}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {stripHtmlToPlainText(content.description || '')}
        </Text>
        
        {/* Points Display */}
        {content.points && (
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.pointsText}>{content.points} points</Text>
          </View>
        )}
        
        {/* Actions */}
        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Ionicons name="thumbs-up-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.actionText}>0</Text>
          </View>
          <View style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={16} color={theme.colors.text.secondary} />
            <Text style={styles.actionText}>0</Text>
          </View>
          
          {/* Mark Complete Button */}
          {!content.completed && (
            <TouchableOpacity 
              style={styles.completeButton}
              onPress={handleMarkComplete}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#4CAF50" />
              <Text style={styles.completeButtonText}>Terminer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Completion Badge */}
      {content.completed && (
        <View style={styles.completedBadge}>
          <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
          <Text style={styles.completedText}>Terminé</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginRight: 10,
    width: 280,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    position: 'relative',
  },
  cardCompleted: {
    opacity: 0.7,
    backgroundColor: '#F8F9FA',
  },
  thumbnailContainer: {
    marginBottom: 12,
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  author: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: theme.colors.text.secondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  pointsText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 5,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completeButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default AgoraContentCard; 