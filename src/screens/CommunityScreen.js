import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../constants/theme';
import Avatar from '../components/Avatar';
import AppHeader from '../components/AppHeader';
import CommunityApi from '../services/communityApi';
import { useAuth } from '../context/FirebaseAuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CommunityScreen = ({ user, onLogout, onTabPress, activeTab, onClose, selectedPostId, onPostPress }) => {
  const { user: currentUser } = useAuth();
  const [commentText, setCommentText] = useState({}); // Store comment text per post
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState([]); // Store selected images for new post
  const [isPublishing, setIsPublishing] = useState(false); // Track publishing state
  const [profileData, setProfileData] = useState(null);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [visibleComments, setVisibleComments] = useState({}); // Track which posts have comments visible
  const [postComments, setPostComments] = useState({}); // Store comments for each post
  const [loadingComments, setLoadingComments] = useState({}); // Track loading state per post
  const [currentImageIndex, setCurrentImageIndex] = useState({}); // Track current image index per post
  const [inputPositions, setInputPositions] = useState({}); // Store Y positions of comment inputs
  const scrollViewRef = useRef(null);
  const commentInputRefs = useRef({});
  const commentInputContainerRefs = useRef({});

  // Fetch profile data for avatar
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { ProfileApi } = await import('../services/profileApi');
        const data = await ProfileApi.getProfile();
        setProfileData(data);
        console.log('[CommunityScreen] 📊 Profile data fetched:', data);
      } catch (error) {
        console.error('[CommunityScreen] ❌ Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch community posts
  const fetchCommunityPosts = async () => {
    try {
      setCommunityLoading(true);
      console.log('👥 CommunityScreen: Fetching community posts...');
      const response = await CommunityApi.getPosts();
      // API returns: { status: "success", data: { posts: [...], pagination: {...} } }
      const posts = response.data?.posts || response.posts || [];
      setCommunityPosts(posts);
      console.log('👥 CommunityScreen: Community posts loaded successfully', posts.length);
    } catch (error) {
      console.error('❌ CommunityScreen: Error fetching community posts:', error);
      console.error('❌ CommunityScreen: Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
      console.log('👥 CommunityScreen: Community posts loading completed');
    }
  };

  // Fetch posts on mount
  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  // Scroll to selected post when component mounts
  useEffect(() => {
    if (selectedPostId && scrollViewRef.current && communityPosts.length > 0) {
      const selectedPostIndex = communityPosts.findIndex(post => post.id === selectedPostId);
      if (selectedPostIndex !== -1) {
        // Add a small delay to ensure the component is fully rendered
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedPostIndex * 300, // Approximate height per post
            animated: true
          });
          console.log('📱 CommunityScreen: Scrolled to selected post:', selectedPostId);
        }, 500);
      }
    }
  }, [selectedPostId, communityPosts]);

  const handleLike = async (postId) => {
    try {
      console.log('👍 CommunityScreen: Toggling like on post:', postId);
      await CommunityApi.toggleLikePost(postId);
      
      // Refresh the post to get updated like status
      await fetchCommunityPosts();
    } catch (error) {
      console.error('❌ CommunityScreen: Error toggling like:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleCommentIconPress = async (postId) => {
    // Toggle comments visibility
    const isVisible = visibleComments[postId];
    
    if (!isVisible) {
      // Show comments - fetch them if not already loaded
      setVisibleComments(prev => ({ ...prev, [postId]: true }));
      
      if (!postComments[postId]) {
        try {
          setLoadingComments(prev => ({ ...prev, [postId]: true }));
          const response = await CommunityApi.getComments(postId);
          // API returns: { status: "success", data: { comments: [...], pagination: {...} } }
          const comments = response.data?.comments || response.comments || [];
          setPostComments(prev => ({ 
            ...prev, 
            [postId]: comments
          }));
        } catch (error) {
          console.error('❌ Error fetching comments:', error);
          setPostComments(prev => ({ ...prev, [postId]: [] }));
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    } else {
      // Hide comments
      setVisibleComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentSubmit = async (postId) => {
    const text = commentText[postId] || '';
    if (text.trim()) {
      try {
        await CommunityApi.addComment(postId, text.trim());
        // Refresh comments to show the new comment
        const response = await CommunityApi.getComments(postId);
        // API returns: { status: "success", data: { comments: [...], pagination: {...} } }
        const comments = response.data?.comments || response.comments || [];
        setPostComments(prev => ({ 
          ...prev, 
          [postId]: comments
        }));
        // Clear comment input
        setCommentText(prev => ({ ...prev, [postId]: '' }));
      } catch (error) {
        console.error('❌ Error adding comment:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    }
  };

  const handleShare = (postId) => {
    console.log('Shared post:', postId);
  };

  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  const handleCloseCreatePost = () => {
    setShowCreatePostModal(false);
    setNewPostText('');
    setSelectedImages([]);
  };

  const handlePublishPost = async () => {
    if (!newPostText.trim() && selectedImages.length === 0) {
      Alert.alert('Erreur', 'Veuillez saisir du contenu ou ajouter une image pour votre post.');
      return;
    }

    try {
      setIsPublishing(true);
      console.log('📝 Publishing new post:', { text: newPostText, imagesCount: selectedImages.length });
      
      // Convert selected images to file format for FormData
      const files = selectedImages.map((image, index) => ({
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || image.name || `image_${Date.now()}_${index}.jpg`,
      }));

      // Create post with content and optional images
      // Backend accepts either text, image, or both
      await CommunityApi.createPost(newPostText.trim() || '', files);
      
      console.log('✅ Post published successfully');
      Alert.alert('Succès', 'Votre post a été publié!');
      
      // Refresh posts list
      await fetchCommunityPosts();
      
      // Close modal and reset state
      handleCloseCreatePost();
    } catch (error) {
      console.error('❌ Error publishing post:', error);
      
      // Use user-friendly error message from backend if available
      const errorMessage = error.userMessage || 
                          error.response?.data?.message || 
                          'Impossible de publier le post. Veuillez réessayer.';
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à votre galerie pour ajouter des images'
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        quality: 0.8,
        selectionLimit: 5, // Limit to 5 images
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Add selected images to state
        const newImages = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          width: asset.width,
          height: asset.height,
        }));
        
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
        console.log('📸 Images selected:', newImages.length);
      }
    } catch (error) {
      console.error('❌ Error selecting images:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handlePostPress = (post) => {
    console.log('📱 CommunityScreen: Post pressed:', post.id);
    if (onPostPress) {
      onPostPress(post);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Maintenant';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      
      if (diffInSeconds < 60) return 'il y a quelques secondes';
      if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
      }
      const days = Math.floor(diffInSeconds / 86400);
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    } catch (error) {
      return 'Maintenant';
    }
  };

  const renderImageCarousel = (post) => {
    const images = post.mediaUrls || [];
    if (images.length === 0) return null;
    
    const currentIndex = currentImageIndex[post.id] || 0;

    const handleScroll = (event) => {
      const scrollPosition = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollPosition / SCREEN_WIDTH);
      setCurrentImageIndex(prev => ({ ...prev, [post.id]: index }));
    };

    return (
      <View style={styles.imageCarouselContainer}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.imageCarousel}
        >
          {images.map((imageUri, index) => (
            <Image
              key={index}
              source={{ uri: imageUri }}
              style={styles.postImage}
            />
          ))}
        </ScrollView>
        {images.length > 1 ? (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  index === currentIndex ? styles.imageIndicatorActive : null
                ]}
              />
            ))}
          </View>
        ) : null}
      </View>
    );
  };

  const renderComments = (post) => {
    if (!visibleComments[post.id]) return null;

    const comments = postComments[post.id] || [];
    const isLoading = loadingComments[post.id];

    return (
      <View style={styles.commentsContainer}>
        {isLoading ? (
          <View style={styles.commentsLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
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
    );
  };

  const renderPost = (post) => {
    const authorName = post.user?.firstName || post.user?.name || 'Utilisateur';
    const authorAvatar = post.user?.avatar || 'https://via.placeholder.com/40';
    const postContent = post.content || '';
    const images = post.mediaUrls || [];
    const likesCount = Number(post._count?.likes || 0);
    const commentsCount = Number(post._count?.comments || 0);
    
    // Check if current user has liked this post by checking the likes array
    // API returns likes array with userId property
    const isLiked = currentUser?.id && post.likes?.some(like => like.userId === currentUser.id || like.user?.id === currentUser.id);
    
    const timeAgo = formatTimeAgo(post.createdAt);
    const showComments = visibleComments[post.id] || false;
    const currentCommentText = commentText[post.id] || '';

    return (
      <View style={styles.postContainer}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <Avatar 
            source={{ uri: authorAvatar }} 
          size={40}
          style={styles.authorAvatar}
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
      <View style={styles.postContent}>
          {postContent ? (
            <Text style={styles.postText}>{postContent}</Text>
          ) : null}
          {images.length > 0 ? renderImageCarousel(post) : null}
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
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
            onPress={() => handleCommentIconPress(post.id)}
          >
            <Ionicons 
              name={showComments ? "chatbubble" : "chatbubble-outline"} 
              size={24} 
              color={showComments ? theme.colors.primary : theme.colors.text.primary} 
            />
            {commentsCount > 0 ? (
              <Text style={styles.actionText}>{commentsCount}</Text>
            ) : null}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleShare(post.id)}
        >
            <Ionicons name="share-outline" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.actionSpacer} />

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="bookmark-outline" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

        {/* Comments Section */}
        {visibleComments[post.id] ? renderComments(post) : null}

        {/* Comment Input Section */}
        <View 
          style={styles.commentSection}
          ref={(ref) => {
            if (ref) commentInputContainerRefs.current[post.id] = ref;
          }}
          onLayout={(event) => {
            // Store the Y position of the input container
            const { y } = event.nativeEvent.layout;
            setInputPositions(prev => ({
              ...prev,
              [post.id]: y
            }));
          }}
          collapsable={false}
        >
        <View style={styles.commentInputContainer}>
          <Avatar 
            source={{ uri: user?.avatar }} 
            size={32}
            style={styles.commentAvatar}
              fallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U'}
          />
          <TextInput
              ref={(ref) => {
                if (ref) commentInputRefs.current[post.id] = ref;
              }}
            style={styles.commentInput}
              placeholder="Ajouter un commentaire..."
              value={currentCommentText}
              onChangeText={(text) => setCommentText(prev => ({ ...prev, [post.id]: text }))}
              onSubmitEditing={() => handleCommentSubmit(post.id)}
              onFocus={() => {
                // Scroll to the input field when focused
                setTimeout(() => {
                  if (scrollViewRef.current) {
                    const storedPosition = inputPositions[post.id];
                    if (storedPosition !== undefined) {
                      // Use stored position with extra padding to ensure visibility above keyboard
                      // Increased offset to push input further up
                      scrollViewRef.current.scrollTo({
                        y: Math.max(0, storedPosition - 400),
                        animated: true,
                      });
                    } else {
                      // Fallback: calculate approximate position based on post index
                      const postIndex = communityPosts.findIndex(p => p.id === post.id);
                      if (postIndex !== -1) {
                        // Calculate approximate scroll position
                        // Each post is roughly 500-700px tall depending on content
                        const estimatedPostHeight = 600;
                        const scrollY = postIndex * estimatedPostHeight + 500; // Add more padding
                        
                        scrollViewRef.current.scrollTo({
                          y: scrollY,
                          animated: true,
                        });
                      }
                    }
                  }
                }, Platform.OS === 'ios' ? 350 : 150);
              }}
            multiline
            maxLength={500}
          />
            {currentCommentText.trim() ? (
              <TouchableOpacity
                onPress={() => handleCommentSubmit(post.id)}
                style={styles.commentSubmitButton}
              >
                <Ionicons name="send" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : null}
        </View>
      </View>
    </View>
  );
  };

  const renderCreatePostModal = () => {
    const displayName = profileData?.firstName && profileData?.lastName
      ? `${profileData.firstName} ${profileData.lastName}`
      : currentUser?.firstName && currentUser?.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : profileData?.name || currentUser?.name || user?.name || 'Utilisateur';
    
    const avatarSource = profileData?.avatar || currentUser?.avatar || user?.avatar;
    const fallbackText = currentUser?.firstName?.charAt(0) || currentUser?.name?.charAt(0) || 
                         user?.firstName?.charAt(0) || user?.name?.charAt(0) || 'U';

    return (
    <Modal
      visible={showCreatePostModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCloseCreatePost}
    >
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Créer un post</Text>
          <TouchableOpacity onPress={handleCloseCreatePost} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.modalUserInfo}>
            <Avatar 
                source={{ uri: avatarSource }} 
              size={40}
              style={styles.modalUserAvatar}
                fallbackText={fallbackText}
            />
              <Text style={styles.modalUserName}>{displayName}</Text>
          </View>

          {/* Post Text Input */}
          <TextInput
            style={styles.postTextInput}
            placeholder="Partagez votre progression et motivez la communauté..."
              placeholderTextColor={theme.colors.text.secondary}
            value={newPostText}
            onChangeText={setNewPostText}
            multiline
            autoFocus
            maxLength={2000}
            textAlignVertical="top"
          />

            {/* Selected Images Preview */}
            {selectedImages.length > 0 ? (
              <View style={styles.selectedImagesContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => handleRemoveImage(index)}
                      >
                        <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                      </TouchableOpacity>
              </View>
                  ))}
                </ScrollView>
            </View>
            ) : null}

            {/* Add Image Section */}
            <TouchableOpacity 
              style={styles.addImageSection} 
              onPress={handleAddImage}
              disabled={selectedImages.length >= 5}
            >
              <Text style={styles.addImageText}>Ajouter à votre post</Text>
              <Ionicons 
                name="image" 
                size={24} 
                color={selectedImages.length >= 5 ? theme.colors.text.secondary : theme.colors.primary} 
              />
          </TouchableOpacity>
            {selectedImages.length >= 5 ? (
              <Text style={styles.maxImagesText}>Maximum 5 images</Text>
            ) : null}
        </ScrollView>

        {/* Publish Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={[
              styles.publishButton,
                (newPostText.trim() || selectedImages.length > 0) && !isPublishing
                  ? styles.publishButtonActive 
                  : styles.publishButtonInactive
            ]}
            onPress={handlePublishPost}
              disabled={(!newPostText.trim() && selectedImages.length === 0) || isPublishing}
          >
              {isPublishing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
            <Text style={[
              styles.publishButtonText,
                  (newPostText.trim() || selectedImages.length > 0)
                    ? styles.publishButtonTextActive 
                    : styles.publishButtonTextInactive
            ]}>
              Publier
            </Text>
              )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <AppHeader
        title="L'Agora"
        onHelpPress={() => {
          if (onTabPress) {
            onTabPress('faq');
          }
        }}
        onNotificationPress={() => {
          if (onTabPress) {
            onTabPress('notifications');
          }
        }}
        onProfilePress={() => {
          if (onTabPress) {
            onTabPress('settings');
          }
        }}
        avatarSource={profileData?.avatar || user?.avatar}
        avatarFallbackText={user?.firstName?.charAt(0) || user?.name?.charAt(0)}
      />

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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Chargement des posts...</Text>
          </View>
        ) : communityPosts.length > 0 ? (
          communityPosts.map((post, index) => (
            <View key={post.id}>
              <TouchableOpacity onPress={() => handlePostPress(post)}>
            {renderPost(post)}
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

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('home')}>
          <Ionicons name="home" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('progress')}>
          <Ionicons name="trending-up-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('nutrition')}>
          <Ionicons name="restaurant" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('achievements')}>
          <Ionicons name="trophy-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navTab} onPress={() => onTabPress('more')}>
          <Ionicons name="add-outline" size={24} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Create Post Modal */}
      {renderCreatePostModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  postContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
  },
  postDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 0,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  authorAvatar: {
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
  postContent: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  postText: {
    fontSize: 14,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  imageCarouselContainer: {
    marginTop: 8,
    position: 'relative',
  },
  imageCarousel: {
    width: SCREEN_WIDTH,
  },
  postImage: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
    resizeMode: 'cover',
    backgroundColor: theme.colors.background,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  imageIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  postActions: {
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
  commentSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
    maxHeight: 100,
    paddingRight: 40,
  },
  commentSubmitButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 4,
  },
  commentsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  commentsLoading: {
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
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  modalUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  postTextInput: {
    fontSize: 16,
    color: theme.colors.text.primary,
    backgroundColor: 'transparent',
    minHeight: 150,
    maxHeight: 300,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 16,
  },
  addImageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  addImageText: {
    fontSize: 15,
    color: theme.colors.text.primary,
    flex: 1,
  },
  selectedImagesContainer: {
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  maxImagesText: {
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  publishButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  publishButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  publishButtonInactive: {
    backgroundColor: theme.colors.border,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  publishButtonTextActive: {
    color: '#FFFFFF',
  },
  publishButtonTextInactive: {
    color: theme.colors.text.secondary,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.text.secondary,
  },
});

export default CommunityScreen; 