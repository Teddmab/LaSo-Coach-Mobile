import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { ShimmerList } from '../../../components/Shimmer';
import { Comment } from '../types';

interface CommentSectionProps {
  postId: string;
  showComments: boolean;
  comments: Comment[];
  loadingComments: boolean;
  commentText: string;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  showComments,
  comments,
  loadingComments,
  commentText,
  onCommentTextChange,
  onCommentSubmit,
}) => {
  if (!showComments) return null;

  return (
    <View style={styles.container}>
      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <Avatar
          size={32}
          style={styles.commentAvatar}
          fallbackText="U"
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Ajouter un commentaire..."
            placeholderTextColor={theme.colors.text.secondary}
            value={commentText}
            onChangeText={onCommentTextChange}
            multiline
            maxLength={500}
          />
          {commentText.trim() ? (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={onCommentSubmit}
            >
              <Ionicons name="send" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Comments List */}
      <View style={styles.commentsContainer}>
        {loadingComments ? (
          <View style={styles.loading}>
            <ShimmerList count={3} itemHeight={60} />
          </View>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Avatar
                source={{ uri: comment.user?.avatar }}
                size={28}
                style={styles.commentItemAvatar}
                fallbackText={comment.user?.firstName?.charAt(0) || comment.user?.name?.charAt(0) || 'U'}
              />
              <View style={styles.commentItemContent}>
                <Text style={styles.commentItemAuthor}>
                  {comment.user?.firstName || comment.user?.name || 'Utilisateur'}
                </Text>
                <Text style={styles.commentItemText}>{comment.content}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noCommentsText}>Aucun commentaire</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginTop: 4,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingRight: 40,
    minHeight: 36,
    maxHeight: 100,
  },
  submitButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
  },
  commentsContainer: {
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  loading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  commentItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  commentItemContent: {
    flex: 1,
  },
  commentItemAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  commentItemText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  noCommentsText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default CommentSection;

