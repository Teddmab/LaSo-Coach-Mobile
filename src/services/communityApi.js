import api from './api';

class CommunityApi {
  async getPosts(page = 1, limit = 10) {
    try {
      console.log('📱 CommunityApi: Fetching posts...', { page, limit });
      
      const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
      
      console.log('📱 CommunityApi: Posts fetched successfully:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error fetching posts:', error);
      throw error;
    }
  }

  async likePost(postId) {
    try {
      console.log('👍 CommunityApi: Liking post...', postId);
      
      const response = await api.post(`/community/posts/${postId}/like`);
      
      console.log('👍 CommunityApi: Post liked successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error liking post:', error);
      throw error;
    }
  }

  async unlikePost(postId) {
    try {
      console.log('👎 CommunityApi: Unliking post...', postId);
      
      const response = await api.delete(`/community/posts/${postId}/like`);
      
      console.log('👎 CommunityApi: Post unliked successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error unliking post:', error);
      throw error;
    }
  }

  async addComment(postId, content) {
    try {
      console.log('💬 CommunityApi: Adding comment...', { postId, content });
      
      const response = await api.post(`/community/posts/${postId}/comments`, {
        content
      });
      
      console.log('💬 CommunityApi: Comment added successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error adding comment:', error);
      throw error;
    }
  }
}

export default new CommunityApi(); 