import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProfileApi } from '../../../services/profileApi';
import CommunityApi from '../../../services/communityApi';
import { useAuth } from '../../../context/FirebaseAuthContext';
import { Post, Comment, SelectedImage } from '../types';

export const useCommunityScreen = (selectedPostId?: string | null) => {
  const { user: currentUser } = useAuth();
  
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [communityPosts, setCommunityPosts] = useState<Post[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [visibleComments, setVisibleComments] = useState<Record<string, boolean>>({});
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [currentImageIndex, setCurrentImageIndex] = useState<Record<string, number>>({});
  
  const scrollViewRef = useRef<any>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
      } catch (error) {
        console.error('[CommunityScreen] ❌ Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  // Fetch community posts
  const fetchCommunityPosts = async (): Promise<void> => {
    try {
      setCommunityLoading(true);
      const response: any = await CommunityApi.getPosts();
      const posts = response.data?.posts || response.posts || [];
      setCommunityPosts(posts);
    } catch (error) {
      console.error('❌ CommunityScreen: Error fetching community posts:', error);
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityPosts();
  }, []);

  // Scroll to selected post
  useEffect(() => {
    if (selectedPostId && scrollViewRef.current && communityPosts.length > 0) {
      const selectedPostIndex = communityPosts.findIndex(post => post.id === selectedPostId);
      if (selectedPostIndex !== -1) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedPostIndex * 300,
            animated: true,
          });
        }, 500);
      }
    }
  }, [selectedPostId, communityPosts]);

  const handleLike = async (postId: string): Promise<void> => {
    try {
      await CommunityApi.toggleLikePost(postId);
      await fetchCommunityPosts();
    } catch (error) {
      console.error('❌ CommunityScreen: Error toggling like:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le like');
    }
  };

  const handleCommentIconPress = async (postId: string): Promise<void> => {
    const isVisible = visibleComments[postId];
    
    if (!isVisible) {
      setVisibleComments(prev => ({ ...prev, [postId]: true }));
      
      if (!postComments[postId]) {
        try {
          setLoadingComments(prev => ({ ...prev, [postId]: true }));
          const response: any = await CommunityApi.getComments(postId);
          const comments = response.data?.comments || response.comments || [];
          setPostComments(prev => ({ ...prev, [postId]: comments }));
        } catch (error) {
          console.error('❌ Error fetching comments:', error);
          setPostComments(prev => ({ ...prev, [postId]: [] }));
        } finally {
          setLoadingComments(prev => ({ ...prev, [postId]: false }));
        }
      }
    } else {
      setVisibleComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentSubmit = async (postId: string): Promise<void> => {
    const text = commentText[postId] || '';
    if (text.trim()) {
      try {
        await CommunityApi.addComment(postId, text.trim());
        const response: any = await CommunityApi.getComments(postId);
        const comments = response.data?.comments || response.comments || [];
        setPostComments(prev => ({ ...prev, [postId]: comments }));
        setCommentText(prev => ({ ...prev, [postId]: '' }));
      } catch (error) {
        console.error('❌ Error adding comment:', error);
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    }
  };

  const handleShare = (postId: string): void => {
    console.log('Shared post:', postId);
  };

  const handleCreatePost = (): void => {
    setShowCreatePostModal(true);
  };

  const handleCloseCreatePost = (): void => {
    setShowCreatePostModal(false);
    setNewPostText('');
    setSelectedImages([]);
  };

  const handlePublishPost = async (): Promise<void> => {
    if (!newPostText.trim() && selectedImages.length === 0) {
      Alert.alert('Erreur', 'Veuillez saisir du contenu ou ajouter une image pour votre post.');
      return;
    }

    try {
      setIsPublishing(true);
      
      const files: any = selectedImages.map((image, index) => ({
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || image.name || `image_${Date.now()}_${index}.jpg`,
      }));

      await CommunityApi.createPost(newPostText.trim() || '', files);
      
      Alert.alert('Succès', 'Votre post a été publié!');
      await fetchCommunityPosts();
      handleCloseCreatePost();
    } catch (error: any) {
      console.error('❌ Error publishing post:', error);
      const errorMessage = error.userMessage || 
                          error.response?.data?.message || 
                          'Impossible de publier le post. Veuillez réessayer.';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAddImage = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez autoriser l\'accès à votre galerie pour ajouter des images'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        allowsEditing: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImages: SelectedImage[] = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image/jpeg',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
          width: asset.width,
          height: asset.height,
        }));
        
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
      console.error('❌ Error selecting images:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner les images');
    }
  };

  const handleRemoveImage = (index: number): void => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const isPostLiked = (post: Post): boolean => {
    if (!currentUser?.id) return false;
    return post.likes?.some(like => 
      like.userId === currentUser.id || like.user?.id === currentUser.id
    ) || false;
  };

  return {
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
    fetchCommunityPosts,
    isPostLiked,
  };
};

