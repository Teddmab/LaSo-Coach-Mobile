import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import Avatar from '../../../components/Avatar';
import { ShimmerList } from '../../../components/Shimmer';
import { Comment } from '../types';
import { useAuth } from '../../../context/FirebaseAuthContext';

interface CommentBottomSheetProps {
  visible: boolean;
  postId: string;
  comments: Comment[];
  loadingComments: boolean;
  commentText: string;
  onClose: () => void;
  onCommentTextChange: (text: string) => void;
  onCommentSubmit: () => void;
}

const CommentBottomSheet: React.FC<CommentBottomSheetProps> = ({
  visible,
  postId,
  comments,
  loadingComments,
  commentText,
  onClose,
  onCommentTextChange,
  onCommentSubmit,
}) => {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const previousCommentsCount = useRef<number>(comments.length);
  
  // Trier les commentaires : plus récent en premier
  const sortedComments = [...comments].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Plus récent en premier
  });

  // Scroll vers le haut quand un nouveau commentaire est ajouté
  useEffect(() => {
    if (comments.length > previousCommentsCount.current && scrollViewRef.current) {
      // Un nouveau commentaire a été ajouté, scroll vers le haut
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
    previousCommentsCount.current = comments.length;
  }, [comments.length]);

  const currentUserAvatar = currentUser?.avatar || '';
  const currentUserName = currentUser?.firstName || currentUser?.name || 'Vous';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={0}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onClose}
          >
            <BlurView
              intensity={20}
              tint="dark"
              style={styles.backdrop}
            />
          </TouchableOpacity>
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Handle */}
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Commentaires</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            {/* Comments List - Scrollable */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.commentsScrollView}
              contentContainerStyle={styles.commentsContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {loadingComments ? (
                <View style={styles.loading}>
                  <ShimmerList count={3} itemHeight={60} />
                </View>
              ) : sortedComments.length > 0 ? (
                sortedComments.map((comment) => {
                  // Gérer différentes structures possibles du backend
                  const commentAny = comment as any;
                  const userData = commentAny.User || comment.user || {};
                  const commentUserName = userData.firstName || userData.first_name || userData.name || userData.fullName || commentAny.userFirstName || commentAny.userName || 'Utilisateur';
                  const commentUserAvatar = userData.avatar || userData.profilePicture || userData.profile_picture || commentAny.userAvatar || '';
                  
                  // Log pour debug si les données utilisateur sont manquantes
                  if (!commentUserName || commentUserName === 'Utilisateur') {
                    console.warn('⚠️ Commentaire sans nom utilisateur:', {
                      commentId: comment.id,
                      userData,
                      allKeys: Object.keys(comment),
                    });
                  }
                  
                  return (
                    <View key={comment.id} style={styles.commentItem}>
                      <Avatar
                        source={{ uri: commentUserAvatar }}
                        size={32}
                        style={styles.commentAvatar}
                        fallbackText={commentUserName?.charAt(0) || 'U'}
                      />
                      <View style={styles.commentContent}>
                        <Text style={styles.commentAuthor}>{commentUserName}</Text>
                        <Text style={styles.commentText}>{comment.content}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Aucun commentaire</Text>
                </View>
              )}
            </ScrollView>

            {/* Comment Input - Fixed at bottom */}
            <View style={styles.inputContainer}>
              <Avatar
                source={{ uri: currentUserAvatar }}
                size={32}
                style={styles.inputAvatar}
                fallbackText={currentUserName?.charAt(0) || 'U'}
              />
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Ajouter un commentaire..."
                  placeholderTextColor="#8E8E8E"
                  value={commentText}
                  onChangeText={onCommentTextChange}
                  multiline
                  maxLength={500}
                  autoFocus={false}
                />
                {commentText.trim() ? (
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={onCommentSubmit}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="send" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: '50%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DBDBDB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  commentsScrollView: {
    flex: 1,
  },
  commentsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loading: {
    paddingVertical: 12,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E8E',
    fontStyle: 'italic',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#DBDBDB',
    backgroundColor: '#FFFFFF',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginBottom: 4,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  input: {
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FAFAFA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingRight: 45,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#DBDBDB',
  },
  submitButton: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -12, // Moitié de la hauteur du bouton (24px / 2) pour centrer verticalement
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#1877F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommentBottomSheet;

