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
  onReport?: (postId: string) => void;
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
  onReport,
  onPostPress,
}) => {
  const authorName = post.user?.firstName || post.user?.name || 'Utilisateur';
  const authorAvatar = post.user?.avatar || '';
  const postContent = post.content || '';
  // Le backend retourne mediaUrls qui est un tableau de strings
  // Adapter comme dans la version web qui utilise post.mediaUrls
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
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => {
            // Show action sheet with report option
            if (onReport) {
              onReport(post.id);
            }
          }}
        >
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

      {/* Post Actions - Style Facebook */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLiked && styles.actionButtonActive]}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#F44336" : "#65676B"} 
          />
          <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>
            {isLiked ? 'J\'aime' : 'J\'aime'}
          </Text>
          {likesCount > 0 && (
            <Text style={[styles.actionText, isLiked && styles.actionTextActive, { marginLeft: 4 }]}>
              ({likesCount})
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onCommentIconPress(post.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#65676B" />
          <Text style={styles.actionText}>Commenter</Text>
          {commentsCount > 0 && (
            <Text style={[styles.actionText, { marginLeft: 4 }]}>
              ({commentsCount})
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => onShare(post.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color="#65676B" />
          <Text style={styles.actionText}>Partager</Text>
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
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    // Ombre style Facebook
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 13,
    color: '#65676B',
  },
  moreButton: {
    padding: 8,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#E4E6EB',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#65676B',
    fontWeight: '600',
  },
  actionSpacer: {
    flex: 1,
  },
  actionButtonActive: {
    backgroundColor: '#F0F2F5',
  },
  actionTextActive: {
    color: '#F44336',
  },
});

export default PostCard;

