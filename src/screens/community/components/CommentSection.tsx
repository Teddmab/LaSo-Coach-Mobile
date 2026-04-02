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
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
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
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F0F2F5',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 15,
    color: '#050505',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 45,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  submitButton: {
    position: 'absolute',
    right: 8,
    top: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1877F2',
  },
  commentsContainer: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  loading: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  commentItemAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  commentItemContent: {
    flex: 1,
    paddingTop: 2,
  },
  commentItemAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#050505',
    marginBottom: 4,
  },
  commentItemText: {
    fontSize: 15,
    color: '#050505',
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#65676B',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },
});

export default CommentSection;

