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
      console.log('👥 Dashboard: Fetching community posts...');
      const response: any = await CommunityApi.getPosts();
      setCommunityPosts((response.data as any)?.posts || []);
      console.log('✅ Dashboard: Community posts loaded successfully');
    } catch (error: any) {
      console.error('❌ Dashboard: Error fetching community posts:', error);
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
      console.log('👍 Dashboard: Liking post:', postId);
      await CommunityApi.likePost(postId);
      
      setCommunityPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, _count: { ...post._count, likes: (post._count?.likes || 0) + 1 } }
            : post
        )
      );
      
      console.log('👍 Dashboard: Post liked successfully');
    } catch (error: any) {
      console.error('❌ Dashboard: Error liking post:', error);
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

