import { useState, useEffect, useCallback } from 'react';
import CommunityApi from '../../../services/communityApi';

export const useCommunity = () => {
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunityPosts = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await CommunityApi.getPosts();
      setCommunityPosts((response.data as any)?.posts || []);
    } catch (error: any) {
      setError(error.message || 'Erreur lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityPosts();
  }, [fetchCommunityPosts]);

  const handleLikePress = useCallback(async (postId: string): Promise<void> => {
    try {
      await CommunityApi.likePost(postId);
      
      setCommunityPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, likes: (post._count?.likes || 0) + 1 } }
            : post
        )
      );
      
    } catch (error: any) {
      throw error;
    }
  }, []);

  return {
    communityPosts,
    loading,
    error,
    fetchCommunityPosts,
    handleLikePress,
    setCommunityPosts,
  };
};

