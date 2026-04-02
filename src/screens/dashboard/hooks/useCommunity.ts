import { useState, useEffect, useCallback } from 'react';
import CommunityApi from '../../../services/communityApi';
import { useAuth } from '../../../context/FirebaseAuthContext';

export const useCommunity = () => {
  const { user: currentUser } = useAuth();
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityPosts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await CommunityApi.getPosts();
      const rawPosts = (response.data as any)?.posts || [];
      
      // ✅ Normaliser les posts pour garantir qu'ils ont tous un objet user
      // Le backend peut retourner soit User (majuscule) soit user (minuscule)
      const normalizedPosts = rawPosts.map((post: any) => {
        // Normaliser l'objet user (gérer User majuscule et user minuscule)
        const userData = post.User || post.user || {};
        const userId = post.userId || post.authorId || post.createdBy || userData.id;
        
        // S'assurer que chaque post a un objet user, même minimal
        return {
          ...post,
          userId: userId,
          user: {
            id: userId,
            ...userData,
            // S'assurer que l'avatar est accessible via plusieurs chemins
            avatar: userData.avatar || userData.profilePicture || userData.imageUrl || userData.avatarUrl,
          },
        };
      });
      
      setCommunityPosts(normalizedPosts);
    } catch (error: any) {
      setError(error.message || 'Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityPosts();
  }, [fetchCommunityPosts]);

  // Helper function to check if a post is liked by current user
  const isPostLiked = useCallback((post: any): boolean => {
    if (!currentUser?.id) return false;
    return post.likes?.some((like: any) => 
      like.userId === currentUser.id || like.user?.id === currentUser.id
    ) || false;
  }, [currentUser?.id]);

  const handleLikePress = useCallback(async (postId: string): Promise<void> => {
    try {
      // Find the post to check if it's already liked
      const post = communityPosts.find(p => p.id === postId);
      if (!post) return;

      const wasLiked = isPostLiked(post);
      const currentLikesCount = Number(post._count?.likes || 0);
      
      // Optimistic update: update state immediately for better UX
      setCommunityPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            const newLikesCount = wasLiked 
              ? Math.max(0, currentLikesCount - 1) 
              : currentLikesCount + 1;
            
            // Update likes array
            const updatedLikes = wasLiked
              ? (p.likes || []).filter((like: any) => 
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
                comments: p._count?.comments ?? 0, // Preserve comment count
              },
              // Preserve user data
              user: p.user || undefined,
            };
          }
          return p;
        })
      );

      // API call in background
      await CommunityApi.toggleLikePost(postId);
      
      // Optionally refresh from server to ensure sync
      // We keep the optimistic update for instant feedback
      
    } catch (error: any) {
      // On error, revert to previous state by refreshing
      await fetchCommunityPosts();
      throw error;
    }
  }, [communityPosts, currentUser?.id, isPostLiked, fetchCommunityPosts]);

  return {
    communityPosts,
    loading,
    error,
    fetchCommunityPosts,
    handleLikePress,
    setCommunityPosts,
    isPostLiked,
  };
};

