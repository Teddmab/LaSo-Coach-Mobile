import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ProfileApi } from '../../../services/profileApi';
import CommunityApi from '../../../services/communityApi';
import { useAuth } from '../../../context/FirebaseAuthContext';
import { Post, Comment, SelectedImage } from '../types';
import * as ugcTermsService from '../../../services/ugcTermsService';

export const useCommunityScreen = (
  selectedPostId?: string | null, 
  termsAccepted: boolean = true,
  onUgcTermsRequired?: () => void
) => {
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
  const previousSelectedPostId = useRef<string | null | undefined>(selectedPostId);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        // Handle case where profile might be null due to Prisma errors
        if (data) {
        setProfileData(data);
        } else {
          console.warn('⚠️ [useCommunityScreen] Profile data is null - Prisma error or missing data');
          setProfileData(null);
        }
      } catch (error) {
        console.error('❌ [useCommunityScreen] Error fetching profile:', error);
        setProfileData(null);
      }
    };
    fetchProfile();
  }, []);

  // Fetch community posts
  const fetchCommunityPosts = async (): Promise<void> => {
    // Don't fetch if terms are not accepted
    if (!termsAccepted) {
      console.warn('⚠️ [useCommunityScreen] UGC terms not accepted - skipping posts fetch');
      setCommunityPosts([]);
      setCommunityLoading(false);
      return;
    }
    
    try {
      setCommunityLoading(true);
      const response: any = await CommunityApi.getPosts();
      // Le backend retourne: { status: "success", data: { posts: [...], pagination: {...} } }
      const posts = response.data?.posts || response.posts || [];
      
      // S'assurer que les posts ont bien mediaUrls et données utilisateur
      // Le backend peut retourner soit mediaUrls (tableau de strings) soit media (tableau d'objets avec url)
      const postsWithMedia = posts.map((post: any) => {
        // Extraire mediaUrls : soit directement, soit depuis media[].url
        let mediaUrls: string[] = [];
        if (post.mediaUrls && Array.isArray(post.mediaUrls)) {
          // Format direct : tableau de strings
          mediaUrls = post.mediaUrls;
        } else if (post.media && Array.isArray(post.media)) {
          // Format avec objets : extraire les URLs
          mediaUrls = post.media
            .map((item: any) => item.url || item.mediaUrl || item)
            .filter((url: any) => url && typeof url === 'string');
        }
        
        // Log complet de la structure du post pour debug
        if (posts.indexOf(post) === 0) {
          console.log('🔍 Structure complète du premier post:', {
            postId: post.id,
            allKeys: Object.keys(post),
            hasUser: !!post.user,
            hasUserCapital: !!post.User,
            userType: typeof post.user,
            UserType: typeof post.User,
            userId: post.userId,
            authorId: post.authorId,
            createdBy: post.createdBy,
            user: post.user,
            User: post.User,
            hasMediaUrls: !!post.mediaUrls,
            hasMedia: !!post.media,
            mediaUrls: post.mediaUrls,
            media: post.media,
            extractedMediaUrls: mediaUrls,
          });
        }
        
        // Le backend retourne les données utilisateur avec une majuscule "User" (Prisma/Sequelize)
        // Le backend peut retourner les données utilisateur de différentes façons:
        // 1. post.User (objet complet avec majuscule - Prisma/Sequelize)
        // 2. post.user (objet complet avec minuscule - format normalisé)
        // 3. post.userId + données séparées
        // 4. post.authorId + données séparées
        // 5. post.createdBy + données séparées
        const userData = post.User || post.user || {};
        const userId = post.userId || post.authorId || post.createdBy || userData.id;
        
        // Normaliser les données utilisateur en vérifiant toutes les variantes possibles
        const normalizedUser = {
          id: userId || userData.id || userData.userId || undefined,
          firstName: userData.firstName || userData.first_name || post.userFirstName || undefined,
          name: userData.name || userData.fullName || post.userName || userData.firstName || undefined,
          avatar: userData.avatar || userData.profilePicture || userData.profile_picture || post.userAvatar || undefined,
        };
        
        // Log pour debug si les données utilisateur sont manquantes
        if (!normalizedUser.firstName && !normalizedUser.name) {
          console.log('⚠️ Post sans nom utilisateur:', {
            postId: post.id,
            userData: userData,
            userId: userId,
            normalizedUser: normalizedUser,
            postKeys: Object.keys(post),
          });
        }
        
        // Normaliser les likes (le backend peut retourner Like avec majuscule ou likes avec minuscule)
        const likes = post.Like || post.likes || [];
        const normalizedLikes = Array.isArray(likes) ? likes : [];
        
        // Normaliser les commentaires (le backend peut retourner Comment avec majuscule ou comments avec minuscule)
        const comments = post.Comment || post.comments || [];
        const normalizedComments = Array.isArray(comments) ? comments : [];
        
        // Préserver le _count du backend (likes et comments)
        // Utiliser la longueur des tableaux comme fallback si _count n'est pas disponible
        const preservedCount = {
          likes: post._count?.likes !== undefined && post._count.likes !== null
            ? Number(post._count.likes)
            : normalizedLikes.length,
          comments: post._count?.comments !== undefined && post._count.comments !== null
            ? Number(post._count.comments)
            : normalizedComments.length,
        };
        
        return {
          ...post,
          mediaUrls: mediaUrls, // Le backend retourne mediaUrls
          user: normalizedUser, // Normaliser les données utilisateur
          likes: normalizedLikes, // Normaliser les likes pour la persistance
          _count: preservedCount, // Préserver le _count avec les valeurs correctes
        };
      });
      
      setCommunityPosts(postsWithMedia);
    } catch (error: any) {
      // Handle different error types gracefully
      if (error.response?.status === 401) {
        console.warn('⚠️ [useCommunityScreen] Unauthorized (401) - token may be expired, posts will be empty');
      } else if (error.response?.status === 403 || error.status === 403) {
        // 403 Forbidden - likely UGC terms not accepted on backend
        const errorMessage = error.response?.data?.message || error.message || error.userMessage || '';
        const isUgcError = errorMessage.includes('UGC') || 
                           errorMessage.includes('terms') || 
                           errorMessage.includes('guidelines') ||
                           errorMessage.includes('community') ||
                           errorMessage.toLowerCase().includes('accept') ||
                           errorMessage.toLowerCase().includes('règles');
        
        console.warn('⚠️ [useCommunityScreen] 403 Forbidden detected', {
          errorMessage,
          isUgcError,
          hasCallback: !!onUgcTermsRequired,
          termsAcceptedLocally: termsAccepted,
        });
        
        // Always show modal for 403 errors related to UGC (even if terms are accepted locally)
        // This handles cases where backend hasn't synced yet or there's a mismatch
        if (onUgcTermsRequired && (isUgcError || !termsAccepted)) {
          console.log('📋 [useCommunityScreen] Triggering UGC terms modal display (403 error)');
          // Show modal immediately
          onUgcTermsRequired();
        }
        
        // Try to sync UGC terms with backend if they're accepted locally
        let shouldRetry = false;
        try {
          const userId = currentUser?.id || currentUser?.uid || null;
          const localStatus = await ugcTermsService.getUgcAcceptanceStatus(userId);
          console.log('🔍 [useCommunityScreen] Local UGC status:', {
            userId,
            accepted: localStatus.accepted,
            timestamp: localStatus.timestamp,
            termsAcceptedProp: termsAccepted,
          });
          
          if (localStatus.accepted && localStatus.timestamp) {
            console.log('🔄 [useCommunityScreen] Re-syncing UGC terms with backend (force sync)...', { userId });
            // Force re-acceptance to ensure backend is in sync
            const syncSuccess = await ugcTermsService.acceptUgcTerms(userId);
            
            if (syncSuccess) {
              // Wait a bit for backend to process
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Verify with backend
              console.log('🔄 [useCommunityScreen] Verifying UGC acceptance with backend...', { userId });
              const backendStatus = await ugcTermsService.getUgcAcceptanceFromBackend(userId);
              
              console.log('🔍 [useCommunityScreen] Backend verification result:', {
                userId,
                accepted: backendStatus.accepted,
                timestamp: backendStatus.timestamp,
                synced: backendStatus.synced,
              });
              
              if (backendStatus.accepted) {
                console.log('✅ [useCommunityScreen] UGC terms verified with backend, retrying fetch immediately...', { userId });
                // Retry immediately - backend should be ready now
                shouldRetry = true;
              } else {
                console.warn('⚠️ [useCommunityScreen] Backend still says UGC not accepted after sync', { userId });
                // Try one more time after a longer delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                const secondCheck = await ugcTermsService.getUgcAcceptanceFromBackend(userId);
                if (secondCheck.accepted) {
                  console.log('✅ [useCommunityScreen] UGC terms verified on second check, retrying fetch...');
                  shouldRetry = true;
                } else {
                  console.warn('⚠️ [useCommunityScreen] UGC terms still not verified after second check');
                  // Still show modal if not already shown
                  if (onUgcTermsRequired && !isUgcError) {
                    onUgcTermsRequired();
                  }
                }
              }
            } else {
              console.warn('⚠️ [useCommunityScreen] Failed to sync UGC terms to backend');
              // Still show modal if not already shown
              if (onUgcTermsRequired && !isUgcError) {
                onUgcTermsRequired();
              }
            }
          } else {
            // No local acceptance - modal already shown above
            console.log('📋 [useCommunityScreen] No local UGC acceptance - modal should be shown');
            if (onUgcTermsRequired) {
              onUgcTermsRequired();
            }
          }
        } catch (syncError) {
          console.warn('⚠️ [useCommunityScreen] Failed to sync UGC terms:', syncError);
          // Show modal on sync error too
          if (onUgcTermsRequired) {
            onUgcTermsRequired();
          }
        }
        
        // If sync succeeded and backend verified, retry fetching posts
        if (shouldRetry) {
          console.log('🔄 [useCommunityScreen] Retrying posts fetch after successful UGC sync...');
          // Retry immediately - don't set empty posts
          try {
            const response: any = await CommunityApi.getPosts();
            const posts = response.data?.posts || response.posts || [];
            
            // Process posts the same way as in the main try block
            const postsWithMedia = posts.map((post: any) => {
              const mediaUrls = post.mediaUrls || [];
              const userData = post.User || post.user || {};
              const userId = post.userId || post.authorId || post.createdBy || userData.id;
              
              const normalizedUser = {
                id: userId || userData.id || userData.userId || undefined,
                firstName: userData.firstName || userData.first_name || post.userFirstName || undefined,
                name: userData.name || userData.fullName || post.userName || userData.firstName || undefined,
                avatar: userData.avatar || userData.profilePicture || userData.profile_picture || post.userAvatar || undefined,
              };
              
              const likes = post.Like || post.likes || [];
              const normalizedLikes = Array.isArray(likes) ? likes : [];
              
              const comments = post.Comment || post.comments || [];
              const normalizedComments = Array.isArray(comments) ? comments : [];
              
              const preservedCount = {
                likes: post._count?.likes !== undefined && post._count.likes !== null
                  ? Number(post._count.likes)
                  : normalizedLikes.length,
                comments: post._count?.comments !== undefined && post._count.comments !== null
                  ? Number(post._count.comments)
                  : normalizedComments.length,
              };
              
              return {
                ...post,
                mediaUrls: mediaUrls,
                user: normalizedUser,
                likes: normalizedLikes,
                _count: preservedCount,
              };
            });
            
            setCommunityPosts(postsWithMedia);
            console.log('✅ [useCommunityScreen] Posts successfully fetched after UGC sync');
            return; // Success - exit without setting empty posts
          } catch (retryError: any) {
            console.error('❌ [useCommunityScreen] Retry failed after UGC sync:', retryError.message || retryError);
            // If retry also fails with 403, there's a deeper issue
            if (retryError.response?.status === 403) {
              console.error('❌ [useCommunityScreen] Still getting 403 after UGC sync - backend may have a different issue');
            }
            // Fall through to set empty posts
          }
        }
        
        // Set empty posts only if sync failed or retry failed
        setCommunityPosts([]);
        return;
      } else if (error.response?.status === 404) {
        console.warn('⚠️ [useCommunityScreen] Posts endpoint not found (404) - returning empty list');
      } else {
        // Pour les autres erreurs, logger seulement si ce n'est pas une erreur 502 (Bad Gateway)
        const is502Error = error.response?.status === 502 || error.status === 502;
        
        if (is502Error) {
          // Erreur 502 souvent temporaire - log silencieux
          if (__DEV__) {
            console.warn('⚠️ [useCommunityScreen] Serveur temporairement indisponible (502) - Réessayez dans quelques minutes');
          }
        } else {
          console.error('❌ [useCommunityScreen] Erreur lors de la récupération des posts:', error.message || error);
        }
      }
      // Set empty array to prevent crashes
      setCommunityPosts([]);
    } finally {
      setCommunityLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch posts if UGC terms are accepted
    if (termsAccepted) {
      // Charger immédiatement les posts (plus de délai artificiel)
      // Le spinner sera affiché pendant le chargement
      console.log('🔄 [useCommunityScreen] Terms accepted, fetching posts immediately...', {
        termsAccepted,
        timestamp: new Date().toISOString(),
      });
      setCommunityLoading(true); // Afficher le spinner immédiatement
      fetchCommunityPosts();
    } else {
      // Clear posts if terms are not accepted
      console.log('📋 [useCommunityScreen] Terms not accepted, clearing posts');
      setCommunityPosts([]);
      setCommunityLoading(false);
    }
  }, [termsAccepted]);

  // Scroll to selected post (uniquement quand selectedPostId change, pas quand communityPosts change)
  useEffect(() => {
    // Ne scroll que si selectedPostId a vraiment changé (pas juste une mise à jour des posts)
    if (selectedPostId && selectedPostId !== previousSelectedPostId.current && scrollViewRef.current && communityPosts.length > 0) {
      const selectedPostIndex = communityPosts.findIndex(post => post.id === selectedPostId);
      if (selectedPostIndex !== -1) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: selectedPostIndex * 300,
            animated: true,
          });
        }, 500);
      }
      // Mettre à jour la référence pour éviter de scroll à nouveau
      previousSelectedPostId.current = selectedPostId;
    }
  }, [selectedPostId, communityPosts.length]); // Utiliser communityPosts.length au lieu de communityPosts pour éviter le scroll lors des mises à jour de contenu

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
                likes: newLikesCount,
                comments: p._count?.comments ?? 0, // Préserver le nombre de commentaires
              },
              // S'assurer que les données utilisateur sont préservées
              user: p.user || undefined,
            };
          }
          return p;
        })
      );

      // Appel API en arrière-plan
      await CommunityApi.toggleLikePost(postId);
      
      // Récupérer le post mis à jour depuis le serveur pour avoir les données complètes des likes
      // Cela garantit que le like est bien persisté et synchronisé avec le backend
      try {
        const updatedPostResponse: any = await CommunityApi.getPost(postId);
        const rawUpdatedPost = updatedPostResponse.data?.post || updatedPostResponse.data || updatedPostResponse;
        
        if (rawUpdatedPost) {
          // Normaliser les données utilisateur
          const userData = rawUpdatedPost.User || rawUpdatedPost.user || {};
          const userId = rawUpdatedPost.userId || rawUpdatedPost.authorId || rawUpdatedPost.createdBy || userData.id;
          
          const normalizedUser = {
            id: userId || userData.id || userData.userId || undefined,
            firstName: userData.firstName || userData.first_name || rawUpdatedPost.userFirstName || undefined,
            name: userData.name || userData.fullName || rawUpdatedPost.userName || userData.firstName || undefined,
            avatar: userData.avatar || userData.profilePicture || userData.profile_picture || rawUpdatedPost.userAvatar || undefined,
          };
          
          // Normaliser les likes (le backend peut retourner Like avec majuscule ou likes avec minuscule)
          const likes = rawUpdatedPost.Like || rawUpdatedPost.likes || [];
          const normalizedLikes = Array.isArray(likes) ? likes : [];
          
          // Normaliser les commentaires (le backend peut retourner Comment avec majuscule ou comments avec minuscule)
          const comments = rawUpdatedPost.Comment || rawUpdatedPost.comments || [];
          const normalizedComments = Array.isArray(comments) ? comments : [];
          
          // Préserver le _count du backend ou utiliser la longueur des tableaux comme fallback
          // Ne pas utiliser currentPost car il contient l'ancien état avant la mise à jour optimiste
          const backendCount = rawUpdatedPost._count || {};
          const preservedCount = {
            likes: backendCount.likes !== undefined && backendCount.likes !== null
              ? Number(backendCount.likes)
              : normalizedLikes.length, // Utiliser directement la longueur du tableau normalisé
            comments: backendCount.comments !== undefined && backendCount.comments !== null
              ? Number(backendCount.comments)
              : normalizedComments.length, // Utiliser directement la longueur du tableau normalisé
          };
          
          console.log('📊 Mise à jour _count:', {
            postId,
            backendCount,
            preservedCount,
            normalizedLikesLength: normalizedLikes.length,
            normalizedCommentsLength: normalizedComments.length,
          });
          
          const updatedPost: Post = {
            ...rawUpdatedPost,
            mediaUrls: rawUpdatedPost.mediaUrls || [],
            user: normalizedUser,
            likes: normalizedLikes, // S'assurer que les likes sont bien inclus
            comments: normalizedComments, // S'assurer que les commentaires sont bien inclus
            _count: preservedCount, // Préserver le _count avec les valeurs correctes (ou utiliser la longueur des tableaux)
          };
          
          // Mettre à jour uniquement le post spécifique sans changer l'ordre
          setCommunityPosts(prevPosts =>
            prevPosts.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  ...updatedPost,
                  // Préserver les données utilisateur, les likes et le _count
                  user: updatedPost.user || p.user,
                  likes: updatedPost.likes || p.likes,
                  _count: updatedPost._count || p._count,
                };
              }
              return p;
            })
          );
        }
      } catch (error) {
        console.error('⚠️ Erreur lors de la récupération du post mis à jour:', error);
        // En cas d'erreur, on garde la mise à jour optimiste locale
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
          const rawComments = response.data?.comments || response.comments || [];
          
          // Normaliser les données utilisateur des commentaires
          const normalizedComments = rawComments.map((comment: any) => {
            // Le backend peut retourner User avec majuscule ou user avec minuscule
            const userData = comment.User || comment.user || {};
            const userId = comment.userId || comment.authorId || comment.createdBy || userData.id;
            
            const normalizedUser = {
              id: userId || userData.id || userData.userId || undefined,
              firstName: userData.firstName || userData.first_name || comment.userFirstName || undefined,
              name: userData.name || userData.fullName || comment.userName || userData.firstName || undefined,
              avatar: userData.avatar || userData.profilePicture || userData.profile_picture || comment.userAvatar || undefined,
            };
            
            return {
              ...comment,
              user: normalizedUser,
            };
          });
          
          console.log('💬 Commentaires normalisés:', {
            postId,
            count: normalizedComments.length,
            firstComment: normalizedComments[0] ? {
              id: normalizedComments[0].id,
              hasUser: !!normalizedComments[0].user,
              userName: normalizedComments[0].user?.name || normalizedComments[0].user?.firstName,
              userAvatar: normalizedComments[0].user?.avatar,
            } : null,
          });
          
          setPostComments(prev => ({ ...prev, [postId]: normalizedComments }));
        } catch (error) {
          console.error('❌ Erreur lors de la récupération des commentaires:', error);
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
        // Recharger les commentaires pour avoir les données complètes (y compris les données utilisateur)
        const response: any = await CommunityApi.getComments(postId);
        const rawComments = response.data?.comments || response.comments || [];
        
        // Normaliser les données utilisateur des commentaires
        const normalizedComments = rawComments.map((comment: any) => {
          // Le backend peut retourner User avec majuscule ou user avec minuscule
          const userData = comment.User || comment.user || {};
          const userId = comment.userId || comment.authorId || comment.createdBy || userData.id;
          
          const normalizedUser = {
            id: userId || userData.id || userData.userId || undefined,
            firstName: userData.firstName || userData.first_name || comment.userFirstName || undefined,
            name: userData.name || userData.fullName || comment.userName || userData.firstName || undefined,
            avatar: userData.avatar || userData.profilePicture || userData.profile_picture || comment.userAvatar || undefined,
          };
          
          return {
            ...comment,
            user: normalizedUser,
          };
        });
        
        // Mettre à jour le compteur de commentaires dans le post
        const currentPost = communityPosts.find(p => p.id === postId);
        if (currentPost) {
          setCommunityPosts(prevPosts =>
            prevPosts.map(p => {
              if (p.id === postId) {
                return {
                  ...p,
                  _count: {
                    ...p._count,
                    comments: normalizedComments.length, // Mettre à jour le nombre de commentaires
                  },
                };
              }
              return p;
            })
          );
        }
        
        setPostComments(prev => ({ ...prev, [postId]: normalizedComments }));
        setCommentText(prev => ({ ...prev, [postId]: '' }));
      } catch (error) {
        console.error('❌ Erreur lors de l\'ajout du commentaire:', error);
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

    // Vérifier que les termes UGC sont acceptés avant de publier
    if (!termsAccepted) {
      Alert.alert(
        'Acceptation requise',
        'Vous devez accepter les règles de la communauté pour publier un post.'
      );
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
      // Handle 403 Forbidden - UGC terms not accepted on backend
      if (error.response?.status === 403) {
        const errorMessage = error.response?.data?.message || '';
        if (errorMessage.includes('UGC') || errorMessage.includes('terms') || errorMessage.includes('guidelines')) {
          console.warn('⚠️ [useCommunityScreen] 403 Forbidden - UGC terms not accepted on backend when creating post. Attempting to sync...');
          
          // Try to sync UGC terms with backend if they're accepted locally
          try {
            const userId = currentUser?.id || currentUser?.uid || null;
            const localStatus = await ugcTermsService.getUgcAcceptanceStatus(userId);
            if (localStatus.accepted && localStatus.timestamp) {
              console.log('🔄 [useCommunityScreen] Re-syncing UGC terms with backend before retrying post creation...', { userId });
              await ugcTermsService.acceptUgcTerms(userId);
              console.log('✅ [useCommunityScreen] UGC terms re-synced, retrying post creation...', { userId });
              
              // Retry creating the post after a delay to ensure backend has processed
              setTimeout(async () => {
                try {
                  const files: any = selectedImages.map((image, index) => ({
                    uri: image.uri,
                    type: image.type || 'image/jpeg',
                    name: image.fileName || image.name || `post_${Date.now()}_${index}.jpg`,
                  }));
                  
                  await CommunityApi.createPost(newPostText.trim() || '', files);
                  Alert.alert('Succès', 'Votre post a été publié!');
                  await fetchCommunityPosts();
                  handleCloseCreatePost();
                } catch (retryError: any) {
                  const retryErrorMessage = retryError.userMessage || 
                                          retryError.response?.data?.message || 
                                          'Impossible de publier le post. Veuillez réessayer.';
                  Alert.alert('Erreur', retryErrorMessage);
                } finally {
                  setIsPublishing(false);
                }
              }, 2000);
              return; // Exit early to avoid showing error alert
            }
          } catch (syncError) {
            console.warn('⚠️ [useCommunityScreen] Failed to sync UGC terms:', syncError);
          }
          
          Alert.alert(
            'Acceptation requise',
            'Vous devez accepter les règles de la communauté pour publier. Veuillez accepter les termes UGC.'
          );
        } else {
          const errorMessage = error.userMessage || 
                              error.response?.data?.message || 
                              'Vous n\'avez pas l\'autorisation de publier ce contenu.';
          Alert.alert('Erreur', errorMessage);
        }
      } else {
      const errorMessage = error.userMessage || 
                          error.response?.data?.message || 
                          'Impossible de publier le post. Veuillez réessayer.';
      Alert.alert('Erreur', errorMessage);
      }
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

  const handleImagePress = (post: Post, imageIndex: number): void => {
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      setModalImages(post.mediaUrls);
      setModalImageIndex(imageIndex);
      setShowImageModal(true);
    }
  };

  const handleCloseImageModal = (): void => {
    setShowImageModal(false);
    setModalImages([]);
    setModalImageIndex(0);
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

