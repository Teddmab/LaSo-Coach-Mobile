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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  
  const scrollViewRef = useRef<any>(null);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
      } catch (error) {
      }
    };
    fetchProfile();
  }, []);

  // Fetch community posts
  const fetchCommunityPosts = async (): Promise<void> => {
    try {
      setCommunityLoading(true);
      const response: any = await CommunityApi.getPosts();
      // Le backend retourne: { status: "success", data: { posts: [...], pagination: {...} } }
      const posts = response.data?.posts || response.posts || [];
      
      // S'assurer que les posts ont bien mediaUrls et données utilisateur (le backend retourne mediaUrls)
      const postsWithMedia = posts.map((post: any) => {
        // Le backend retourne mediaUrls qui est un tableau de strings
        const mediaUrls = post.mediaUrls || [];
        
        // S'assurer que les données utilisateur sont correctement mappées
        // Le backend peut retourner user avec firstName, name, avatar, etc.
        const userData = post.user || {};
        const normalizedUser = {
          id: userData.id || userData.userId || undefined,
          firstName: userData.firstName || userData.first_name || undefined,
          name: userData.name || userData.fullName || userData.firstName || undefined,
          avatar: userData.avatar || userData.profilePicture || userData.profile_picture || undefined,
        };
        
        // Log pour debug si les données utilisateur sont manquantes
        if (!normalizedUser.firstName && !normalizedUser.name) {
          console.log('⚠️ Post sans nom utilisateur:', {
            postId: post.id,
            userData: userData,
            normalizedUser: normalizedUser,
          });
        }
        
        // Log pour debug si l'avatar est manquant
        if (!normalizedUser.avatar) {
          console.log('⚠️ Post sans avatar utilisateur:', {
            postId: post.id,
            userId: normalizedUser.id,
            userName: normalizedUser.firstName || normalizedUser.name,
          });
        }
        
        return {
          ...post,
          mediaUrls: mediaUrls, // Le backend retourne mediaUrls
          user: normalizedUser, // Normaliser les données utilisateur
        };
      });
      
      setCommunityPosts(postsWithMedia);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des posts:', error);
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
      // Mettre à jour l'état localement immédiatement pour une meilleure UX
      const post = communityPosts.find(p => p.id === postId);
      if (!post) return;

      const wasLiked = isPostLiked(post);
      const currentLikesCount = Number(post._count?.likes || 0);
      
      // Mise à jour optimiste de l'état local
      setCommunityPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            const newLikesCount = wasLiked 
              ? Math.max(0, currentLikesCount - 1) 
              : currentLikesCount + 1;
            
            // Mettre à jour les likes
            const updatedLikes = wasLiked
              ? (p.likes || []).filter(like => 
                  like.userId !== currentUser?.id && like.user?.id !== currentUser?.id
                )
              : [
                  ...(p.likes || []),
                  { userId: currentUser?.id, user: { id: currentUser?.id } }
                ];
            
            return {
              ...p,
              likes: updatedLikes,
              _count: {
                ...p._count,
                likes: newLikesCount,
              },
            };
          }
          return p;
        })
      );

      // Appel API en arrière-plan
      await CommunityApi.toggleLikePost(postId);
      
      // Rafraîchir les données depuis le serveur pour s'assurer de la cohérence
      // (mais sans rafraîchir visuellement la page)
      const response: any = await CommunityApi.getPosts();
      const posts = response.data?.posts || response.posts || [];
      const updatedPost = posts.find((p: Post) => p.id === postId);
      
      if (updatedPost) {
        setCommunityPosts(prevPosts =>
          prevPosts.map(p => p.id === postId ? updatedPost : p)
        );
      }
    } catch (error) {
      // En cas d'erreur, restaurer l'état précédent
      await fetchCommunityPosts();
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
        Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
      }
    }
  };

  const handleShare = (postId: string): void => {
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
      
      // Préparer les fichiers comme dans la version web
      // Le backend attend le champ 'media' avec multer.array('media', 5)
      const files: any = selectedImages.map((image, index) => ({
        uri: image.uri, // URI accessible (file://) après copyFileToAccessibleLocation
        type: image.type || 'image/jpeg',
        name: image.fileName || image.name || `post_${Date.now()}_${index}.jpg`,
      }));

      await CommunityApi.createPost(newPostText.trim() || '', files);
      
      Alert.alert('Succès', 'Votre post a été publié!');
      await fetchCommunityPosts();
      handleCloseCreatePost();
    } catch (error: any) {
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
        allowsEditing: false, // Désactivé pour éviter les problèmes de URI sur Android
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Copier les fichiers vers un emplacement accessible (comme pour les photos de progression)
        const newImages: SelectedImage[] = await Promise.all(
          result.assets.map(async (asset) => {
            const imageUri = asset.uri;
            
            // Déterminer le type MIME correct
            let mimeType = asset.type || 'image/jpeg';
            if (mimeType === 'image' || !mimeType.includes('/')) {
              const uri = imageUri || '';
              const fileName = asset.fileName || asset.name || '';
              
              if (uri.match(/\.(png)$/i) || fileName.match(/\.(png)$/i)) {
                mimeType = 'image/png';
              } else if (uri.match(/\.(jpg|jpeg)$/i) || fileName.match(/\.(jpg|jpeg)$/i)) {
                mimeType = 'image/jpeg';
              } else {
                mimeType = 'image/jpeg';
              }
            }
            
            // Copier le fichier vers un emplacement accessible
            const accessibleUri = await ProfileApi.copyFileToAccessibleLocation(imageUri, mimeType);
            
            // Préparer le nom de fichier avec la bonne extension
            const fileName = asset.fileName || asset.name || `post_${Date.now()}.jpg`;
            const extension = mimeType.includes('png') ? 'png' : 'jpg';
            const finalFileName = fileName.includes('.') 
              ? fileName 
              : `${fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
            
            return {
              uri: accessibleUri,
              type: mimeType,
              fileName: finalFileName,
              name: finalFileName,
              width: asset.width,
              height: asset.height,
            };
          })
        );
        
        setSelectedImages(prev => [...prev, ...newImages].slice(0, 5));
      }
    } catch (error) {
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

  const handleReport = (postId: string): void => {
    setReportingPostId(postId);
    setShowReportModal(true);
  };

  const handleCloseReportModal = (): void => {
    setShowReportModal(false);
    setReportingPostId(null);
  };

  const handleSubmitReport = async (postId: string, reason: string): Promise<void> => {
    try {
      await CommunityApi.reportPost(postId, reason);
      // Le modal affichera le message de succès
    } catch (error: any) {
      // Extraire le message d'erreur utilisateur
      if (error.response?.data?.message) {
        error.userMessage = error.response.data.message;
      } else if (error.message) {
        error.userMessage = error.message;
      }
      throw error;
    }
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
  };
};

