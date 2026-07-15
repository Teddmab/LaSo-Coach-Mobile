import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import { CommunityScreenProps } from './community/types';
import { useCommunityScreen } from './community/hooks/useCommunityScreen';
import { useUgcTerms } from '../hooks/useUgcTerms';
import { useModeration } from '../hooks/useModeration';
import UgcTermsModal from '../components/UgcTermsModal';
import BlockUserModal from '../components/BlockUserModal';
import PostCard from './community/components/PostCard';
import CreatePostModal from './community/components/CreatePostModal';
import ReportPostModal from './community/components/ReportPostModal';
import ImageFullScreenModal from './community/components/ImageFullScreenModal';
import CommentBottomSheet from './community/components/CommentBottomSheet';
import { ShimmerCard } from '../components/Shimmer';
import NouveautesBottomSheet from '../components/nouveautes/NouveautesBottomSheet';
import { useNouveautes } from '../hooks/useNouveautes';

const CommunityScreen: React.FC<CommunityScreenProps> = ({
  user,
  onTabPress,
  activeTab,
  selectedPostId,
  onPostPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [commentBottomSheetVisible, setCommentBottomSheetVisible] = useState(false);
  const [selectedPostForComments, setSelectedPostForComments] = useState<string | null>(null);
  
  // ✅ COMPLIANCE: Moderation hook for blocking users
  const {
    blockedUsers: blockedUsersList,
    isUserBlocked,
    blockUser: blockUserAction,
    unblockUser: unblockUserAction,
  } = useModeration();
  
  // Convert array to Set for O(1) lookup
  const blockedUsers = React.useMemo(() => new Set(blockedUsersList), [blockedUsersList]);
  
  // Block user modal state
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [userToBlock, setUserToBlock] = useState<{ id: string; name: string } | null>(null);

  // Phase 7 - TODO #9: Test UGC terms modal on community entry
  const {
    termsAccepted,
    termsLoading,
    showTermsModal,
    setShowTermsModal,
    handleAcceptTerms,
    handleDeclineTerms,
  } = useUgcTerms();
  
  const handleViewTerms = () => {
    navigation.navigate('TermsAndPolicies' as never);
  };
  
  // Callback to show UGC modal when 403 error indicates terms not accepted
  const handleUgcTermsRequired = () => {
    console.log('📋 [CommunityScreen] UGC terms required - showing modal');
    setShowTermsModal(true);
  };
  
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
    handleCommentIconPress: originalHandleCommentIconPress,
    handleCommentSubmit,
    handleShare,
    handleCreatePost,
    handleCloseCreatePost,
    handlePublishPost,
    handleAddImage,
    handleRemoveImage,
    isPostLiked,
    showReportModal,
    reportingPostId,
    handleReport,
    handleCloseReportModal,
    handleSubmitReport,
    showImageModal,
    modalImages,
    modalImageIndex,
    handleImagePress,
    handleCloseImageModal,
  } = useCommunityScreen(selectedPostId, termsAccepted, handleUgcTermsRequired);

  // Gérer l'ouverture du bottom sheet de commentaires
  const handleCommentIconPress = (postId: string) => {
    setSelectedPostForComments(postId);
    setCommentBottomSheetVisible(true);
    // Appeler aussi la fonction originale pour charger les commentaires
    originalHandleCommentIconPress(postId);
  };

  const handleCloseCommentBottomSheet = () => {
    setCommentBottomSheetVisible(false);
    setSelectedPostForComments(null);
  };

  const handleCommentSubmitWithBottomSheet = (postId: string) => {
    handleCommentSubmit(postId);
    // Le nouveau commentaire apparaîtra en haut grâce au tri dans CommentBottomSheet
  };

  // ✅ COMPLIANCE: Handle user blocking
  const handleBlockUser = (userId: string, userName: string) => {
    setUserToBlock({ id: userId, name: userName });
    setShowBlockModal(true);
  };

  const handleConfirmBlock = async (userId: string) => {
    try {
      const isBlocked = isUserBlocked(userId);
      if (isBlocked) {
        await unblockUserAction(userId);
      } else {
        await blockUserAction(userId);
      }
      setShowBlockModal(false);
      setUserToBlock(null);
    } catch (error) {
      console.error('❌ [CommunityScreen] Error blocking user:', error);
    }
  };

  const handleCancelBlock = () => {
    setShowBlockModal(false);
    setUserToBlock(null);
  };

  // Nouveautés Agora : affiché une seule fois après acceptation des UGC
  const {
    visible: showNouveautesAgora,
    onComplete: onNouveautesAgoraComplete,
    steps: nouveautesAgoraSteps,
  } = useNouveautes('agora', undefined, { trigger: termsAccepted });

  return (
    <>
      {/* Phase 7 - TODO #10: Display loading state while checking terms */}
      {termsLoading && !termsAccepted ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !termsAccepted ? (
        // User has not accepted terms - show prompt
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>📋 Acceptation requise</Text>
          <Text style={styles.emptyDescription}>
            Veuillez accepter les règles de la communauté pour accéder aux fonctionnalités de l'Agora.
          </Text>
        </View>
      ) : (
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
              // ✅ COMPLIANCE: Filter out posts from blocked users
              communityPosts
                .filter(post => {
                  const postUserId = (post as any).userId || post.user?.id;
                  return postUserId && !blockedUsers.has(String(postUserId));
                })
                .map((post, index) => (
                <PostCard
                  key={post.id}
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
                  onReport={handleReport}
                  onBlockUser={handleBlockUser}
                  isLast={index === communityPosts.length - 1}
                  onPostPress={(post) => {
                    // Si le post a un selectedImageIndex, ouvrir la modal plein écran
                    if ((post as any).selectedImageIndex !== undefined && post.mediaUrls && post.mediaUrls.length > 0) {
                      handleImagePress(post, (post as any).selectedImageIndex);
                    } else if (onPostPress) {
                      onPostPress(post);
                    }
                  }}
                />
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aucun post pour le moment</Text>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Report Post Modal */}
      {reportingPostId && (
        <ReportPostModal
          visible={showReportModal}
          postId={reportingPostId}
          postAuthor={
            communityPosts.find(p => p.id === reportingPostId)?.user?.name ||
            communityPosts.find(p => p.id === reportingPostId)?.user?.firstName ||
            undefined
          }
          onClose={handleCloseReportModal}
          onReport={handleSubmitReport}
        />
      )}

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

      {/* Image Full Screen Modal */}
      <ImageFullScreenModal
        visible={showImageModal}
        images={modalImages}
        initialIndex={modalImageIndex}
        onClose={handleCloseImageModal}
      />

      {/* Comment Bottom Sheet */}
      {selectedPostForComments && (
        <CommentBottomSheet
          visible={commentBottomSheetVisible}
          postId={selectedPostForComments}
          comments={postComments[selectedPostForComments] || []}
          loadingComments={loadingComments[selectedPostForComments] || false}
          commentText={commentText[selectedPostForComments] || ''}
          onClose={handleCloseCommentBottomSheet}
          onCommentTextChange={(text) => setCommentText(prev => ({ ...prev, [selectedPostForComments]: text }))}
          onCommentSubmit={async () => {
            if (selectedPostForComments) {
              await handleCommentSubmitWithBottomSheet(selectedPostForComments);
              // Fermer le clavier après l'envoi du commentaire
              Keyboard.dismiss();
            }
          }}
        />
      )}

      {/* UGC Terms Modal */}
      <UgcTermsModal
        visible={showTermsModal}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        onViewTerms={handleViewTerms}
      />

      {/* Block User Modal */}
      {userToBlock && (
        <BlockUserModal
          visible={showBlockModal}
          userId={userToBlock.id}
          userName={userToBlock.name}
          isBlocked={isUserBlocked(userToBlock.id)}
          onConfirm={handleConfirmBlock}
          onCancel={handleCancelBlock}
        />
      )}

      {/* Nouveautés Agora - une seule fois après acceptation UGC */}
      <NouveautesBottomSheet
        visible={showNouveautesAgora}
        steps={nouveautesAgoraSteps}
        onComplete={onNouveautesAgoraComplete}
        variant="agora"
      />
    </>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Style Instagram - fond blanc uni
  },
  scrollContent: {
    paddingBottom: 100,
    backgroundColor: '#FFFFFF', // Style Instagram - fond blanc uni
  },
  introCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 0, // Style Instagram - pas d'espacement
    borderBottomWidth: 1,
    borderBottomColor: '#DBDBDB', // Ligne de séparation subtile
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
    fontSize: 14,
    color: '#8E8E8E',
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
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

