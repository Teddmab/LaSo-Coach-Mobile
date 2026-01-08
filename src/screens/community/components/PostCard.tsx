import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { Post } from '../types';
import { formatTimeAgo } from '../utils/communityUtils';
import ImageCarousel from './ImageCarousel';

interface PostCardProps {
  post: Post;
  currentUserId?: string | number | null;
  isLiked: boolean;
  showComments: boolean;
  comments: any[];
  loadingComments: boolean;
  commentText: string;
  onLike: (postId: string) => void;
  onCommentIconPress: (postId: string) => void;
  onCommentTextChange?: (postId: string, text: string) => void;
  onCommentSubmit: (postId: string) => void;
  onShare: (postId: string) => void;
  onReport?: (postId: string) => void;
  onPostPress?: (post: Post) => void;
  isLast?: boolean; // Pour retirer la bordure du dernier post
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserId,
  isLiked,
  showComments,
  comments,
  loadingComments,
  commentText,
  onLike,
  onCommentIconPress,
  onCommentTextChange,
  onCommentSubmit,
  onShare,
  onReport,
  onPostPress,
  isLast = false,
}) => {
  const authorName = post.user?.firstName || post.user?.name || 'Utilisateur';
  const authorAvatar = post.user?.avatar || '';
  const postContent = post.content || '';
  // Le backend retourne mediaUrls qui est un tableau de strings
  // Adapter comme dans la version web qui utilise post.mediaUrls
  const images = post.mediaUrls || [];
  // Utiliser _count.likes si disponible, sinon utiliser la longueur du tableau likes comme fallback
  const likesCount = Number(
    post._count?.likes !== undefined && post._count.likes !== null
      ? post._count.likes
      : (post.likes?.length ?? 0)
  );
  // Utiliser _count.comments si disponible, sinon utiliser la longueur du tableau comments comme fallback
  const commentsCount = Number(
    post._count?.comments !== undefined && post._count.comments !== null
      ? post._count.comments
      : (post.comments?.length ?? 0)
  );
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={[styles.container, isLast && styles.containerLast]}>
      {/* Post Header - Style Instagram */}
      <View style={styles.header}>
        <Avatar 
          source={{ uri: authorAvatar }} 
          size={32}
          style={styles.avatar}
          fallbackText={authorName?.charAt(0) || 'U'}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
        </View>
        <Text style={styles.postTime}>{timeAgo || 'Maintenant'}</Text>
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            if (onReport) {
              onReport(post.id);
            }
          }}
        >
          <Ionicons name="ellipsis-horizontal" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Post Image - Style Instagram (pleine largeur) */}
      {images.length > 0 && (
        <ImageCarousel 
          postId={post.id} 
          images={images}
          onImagePress={(index) => onPostPress && onPostPress({ ...post, selectedImageIndex: index })}
        />
      )}

      {/* Post Actions - Style Instagram (icônes avec compteurs) */}
      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => onLike(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#F44336" : "#000000"} 
            />
            {likesCount > 0 && (
              <Text style={styles.actionCount}>{likesCount}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => onCommentIconPress(post.id)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#000000" />
            {commentsCount > 0 ? (
              <Text style={styles.actionCount}>{commentsCount}</Text>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Content - Style Instagram (texte en bas) */}
      {postContent ? (
        <View style={styles.content}>
          <Text style={styles.postText}>
            <Text style={styles.authorNameInline}>{authorName} </Text>
            {postContent}
          </Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    marginBottom: 0, // Pas d'espacement entre les posts
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB', // Ligne de séparation subtile entre les posts (style Instagram)
    paddingBottom: 0, // Pas de padding supplémentaire
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  authorNameInline: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  postTime: {
    fontSize: 12,
    color: '#8E8E8E',
    marginRight: 8,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  postText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingTop: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    gap: 6,
  },
  actionCount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '400',
  },
  containerLast: {
    borderBottomWidth: 0, // Pas de bordure pour le dernier post
  },
});

export default PostCard;

