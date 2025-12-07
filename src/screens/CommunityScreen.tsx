import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom } // Espace pour la barre de navigation + safe area
          ]}
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
                <TouchableOpacity 
                  onPress={() => onPostPress && onPostPress(post)}
                  activeOpacity={1}
                >
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
    backgroundColor: '#F0F2F5',
  },
  scrollContent: {
    paddingBottom: (styleProps: any) => {
      // Calculer l'espace nécessaire pour la barre de navigation
      // Barre de navigation: paddingTop (9) + icône (24) + paddingVertical (12*2) + paddingBottom (max(insets.bottom, 16))
      // On ajoute un peu plus pour être sûr que les boutons sont visibles
      const insets = styleProps?.insets || { bottom: 0 };
      const bottomNavHeight = 9 + 24 + 24 + Math.max(insets.bottom || 16, 16);
      return bottomNavHeight + 20; // 20px d'espace supplémentaire
    },
    backgroundColor: '#F0F2F5',
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E6EB',
    // Ombre légère
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  introAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  introText: {
    fontSize: 15,
    color: '#65676B',
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F0F2F5',
    borderRadius: 20,
  },
  postDivider: {
    height: 8,
    backgroundColor: '#F0F2F5',
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

