import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import { CommunityScreenProps } from './community/types';
import { useCommunityScreen } from './community/hooks/useCommunityScreen';
import PostCard from './community/components/PostCard';
import CreatePostModal from './community/components/CreatePostModal';
import { ShimmerCard } from '../components/Shimmer';

const CommunityScreen: React.FC<CommunityScreenProps> = ({
  user,
  onTabPress,
  activeTab,
  selectedPostId,
  onPostPress,
}) => {
  const {
    commentText,
    showCreatePostModal,
    newPostText,
    selectedImages,
    isPublishing,
    profileData,
    communityPosts,
    communityLoading,
    visibleComments,
    postComments,
    loadingComments,
    currentUser,
    scrollViewRef,
    setCommentText,
    setNewPostText,
    handleLike,
    handleCommentIconPress,
    handleCommentSubmit,
    handleShare,
    handleCreatePost,
    handleCloseCreatePost,
    handlePublishPost,
    handleAddImage,
    handleRemoveImage,
    isPostLiked,
  } = useCommunityScreen(selectedPostId);

  return (
    <>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Community Intro */}
          <TouchableOpacity style={styles.introCard} onPress={handleCreatePost}>
            <Avatar 
              source={{ uri: profileData?.avatar || currentUser?.avatar || user?.avatar }} 
              size={40}
              style={styles.introAvatar}
              fallbackText={currentUser?.firstName?.charAt(0) || currentUser?.name?.charAt(0) || user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
            />
            <Text style={styles.introText}>
              Partagez votre progression et motivez la communauté...
            </Text>
          </TouchableOpacity>

          {/* Posts Feed */}
          {communityLoading ? (
            <View style={styles.sectionContainer}>
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
            </View>
          ) : communityPosts.length > 0 ? (
            communityPosts.map((post, index) => (
              <View key={post.id}>
                <TouchableOpacity onPress={() => onPostPress && onPostPress(post)}>
                  <PostCard
                    post={post}
                    currentUserId={currentUser?.id}
                    isLiked={isPostLiked(post)}
                    showComments={visibleComments[post.id] || false}
                    comments={postComments[post.id] || []}
                    loadingComments={loadingComments[post.id] || false}
                    commentText={commentText[post.id] || ''}
                    onLike={handleLike}
                    onCommentIconPress={handleCommentIconPress}
                    onCommentTextChange={(postId, text) => setCommentText(prev => ({ ...prev, [postId]: text }))}
                    onCommentSubmit={handleCommentSubmit}
                    onShare={handleShare}
                    onPostPress={onPostPress}
                  />
                </TouchableOpacity>
                {index < communityPosts.length - 1 ? <View style={styles.postDivider} /> : null}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Create Post Modal */}
      <CreatePostModal
        visible={showCreatePostModal}
        postText={newPostText}
        selectedImages={selectedImages}
        isPublishing={isPublishing}
        onPostTextChange={setNewPostText}
        onAddImage={handleAddImage}
        onRemoveImage={handleRemoveImage}
        onPublish={handlePublishPost}
        onClose={handleCloseCreatePost}
      />
    </>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  introCard: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  introAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  introText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  postDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 0,
  },
  sectionContainer: {
    padding: 20,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default CommunityScreen;

