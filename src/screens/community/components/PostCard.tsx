import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { Post } from '../types';
import { formatTimeAgo } from '../utils/communityUtils';
import ImageCarousel from './ImageCarousel';
import CommentSection from './CommentSection';

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
  onPostPress?: (post: Post) => void;
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
  onPostPress,
}) => {
  const authorName = post.user?.firstName || post.user?.name || 'Utilisateur';
  const authorAvatar = post.user?.avatar || '';
  const postContent = post.content || '';
  const images = post.mediaUrls || [];
  const likesCount = Number(post._count?.likes || 0);
  const commentsCount = Number(post._count?.comments || 0);
  const timeAgo = formatTimeAgo(post.createdAt);

  return (
    <View style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <Avatar 
          source={{ uri: authorAvatar }} 
          size={40}
          style={styles.avatar}
          fallbackText={authorName?.charAt(0) || 'U'}
        />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{authorName}</Text>
          <Text style={styles.postTime}>{timeAgo || 'Maintenant'}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.content}>
        {postContent ? (
          <Text style={styles.postText}>{postContent}</Text>
        ) : null}
        {images.length > 0 ? (
          <ImageCarousel postId={post.id} images={images} />
        ) : null}
      </View>

      {/* Post Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onLike(post.id)}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? "#F44336" : theme.colors.text.primary} 
          />
          {likesCount > 0 ? (
            <Text style={styles.actionText}>{likesCount}</Text>
          ) : null}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onCommentIconPress(post.id)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={theme.colors.text.primary} />
          {commentsCount > 0 ? (
            <Text style={styles.actionText}>{commentsCount}</Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.actionSpacer} />

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
        >
          <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Comment Section */}
        <CommentSection
          postId={post.id}
          showComments={showComments}
          comments={comments}
          loadingComments={loadingComments}
          commentText={commentText}
          onCommentTextChange={(text) => onCommentTextChange && onCommentTextChange(post.id, text)}
          onCommentSubmit={() => onCommentSubmit(post.id)}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  moreButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  actionSpacer: {
    flex: 1,
  },
});

export default PostCard;

