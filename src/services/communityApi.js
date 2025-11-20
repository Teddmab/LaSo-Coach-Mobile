import api from './api';

class CommunityApi {
  /**
   * Get all posts with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response with posts and pagination
   */
  async getPosts(page = 1, limit = 10) {
    try {
      console.log('📱 CommunityApi: Fetching posts...', { page, limit });
      
      const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
      
      // API returns: { status: "success", data: { posts: [...], pagination: {...} } }
      console.log('📱 CommunityApi: Posts fetched successfully:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Get single post by ID
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Post data
   */
  async getPost(postId) {
    try {
      console.log('📱 CommunityApi: Fetching post...', postId);
      
      const response = await api.get(`/community/posts/${postId}`);
      
      console.log('📱 CommunityApi: Post fetched successfully:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error fetching post:', error);
      throw error;
    }
  }

  /**
   * Create a new post
   * @param {string} content - Post content (Markdown supported)
   * @param {Array<File>} files - Optional media files
   * @returns {Promise<Object>} Created post data
   */
  async createPost(content, files = []) {
    try {
      console.log('📝 CommunityApi: Creating post...', { content, filesCount: files.length });
      
      // Backend accepts either text, image, or both
      // Field name must be 'media' (not 'files', 'image', or 'photo')
      // Content-Type should NOT be manually set - axios handles it automatically
      
      if (files.length > 0) {
        // Use FormData for file uploads (multipart/form-data)
        const formData = new FormData();
        
        // Content is optional but recommended
        if (content && content.trim()) {
          formData.append('content', content.trim());
        }
        
        // Add images with field name 'media' (backend expects this exact name)
        files.forEach((file, index) => {
          formData.append('media', {
            uri: file.uri,
            type: file.type || 'image/jpeg',  // Must be 'image/jpeg' or 'image/png'
            name: file.name || `photo-${Date.now()}-${index}.jpg`,
          });
        });
        
        // Don't set Content-Type manually - let axios handle it with boundary
        const response = await api.post('/community/posts', formData);
        
        // Backend returns: { status: "success", data: { id, content, media, user, ... } }
        const postData = response.data?.data || response.data;
        console.log('📝 CommunityApi: Post created successfully with media');
        return postData;
      } else {
        // JSON request for text-only posts
        // Content is required for text-only posts
        if (!content || !content.trim()) {
          throw new Error('Le contenu de la publication ou l\'image ne peut pas être vide.');
        }
        
        const response = await api.post('/community/posts', { content: content.trim() });
        
        // Backend returns: { status: "success", data: { id, content, media, user, ... } }
        const postData = response.data?.data || response.data;
        console.log('📝 CommunityApi: Post created successfully');
        return postData;
      }
    } catch (error) {
      console.error('❌ CommunityApi: Error creating post:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        }
      });
      
      // Extract user-friendly error message from backend response
      if (error.response?.data?.message) {
        error.userMessage = error.response.data.message;
      }
      
      throw error;
    }
  }

  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Response with success message
   */
  async toggleLikePost(postId) {
    try {
      console.log('👍 CommunityApi: Toggling like on post...', postId);
      
      const response = await api.post(`/community/posts/${postId}/like`);
      
      // API returns: { status: "success", message: "Post liked successfully" } or "Post unliked successfully"
      console.log('👍 CommunityApi: Post like toggled:', response.data?.message);
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error toggling like:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use toggleLikePost instead - API uses toggle endpoint
   * Alias for toggleLikePost for backward compatibility
   */
  async likePost(postId) {
    return this.toggleLikePost(postId);
  }

  /**
   * Add a comment to a post
   * @param {string} postId - Post UUID
   * @param {string} content - Comment content (Markdown supported)
   * @returns {Promise<Object>} Created comment data
   */
  async addComment(postId, content) {
    try {
      console.log('💬 CommunityApi: Adding comment...', { postId, content });
      
      const response = await api.post(`/community/posts/${postId}/comments`, {
        content
      });
      
      // API returns: { status: "success", data: { id, content, user, ... } }
      console.log('💬 CommunityApi: Comment added successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post with pagination
   * @param {string} postId - Post UUID
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response with comments and pagination
   */
  async getComments(postId, page = 1, limit = 10) {
    try {
      console.log('💬 CommunityApi: Fetching comments...', { postId, page, limit });
      
      const response = await api.get(`/community/posts/${postId}/comments?page=${page}&limit=${limit}`);
      
      // API returns: { status: "success", data: { comments: [...], pagination: {...} } }
      console.log('💬 CommunityApi: Comments fetched successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error fetching comments:', error);
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment UUID
   * @returns {Promise<Object>} Success response
   */
  async deleteComment(commentId) {
    try {
      console.log('🗑️ CommunityApi: Deleting comment...', commentId);
      
      const response = await api.delete(`/community/comments/${commentId}`);
      
      console.log('🗑️ CommunityApi: Comment deleted successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Toggle like on a comment
   * @param {string} commentId - Comment UUID
   * @returns {Promise<Object>} Response with success message
   */
  async toggleLikeComment(commentId) {
    try {
      console.log('👍 CommunityApi: Toggling like on comment...', commentId);
      
      const response = await api.post(`/community/comments/${commentId}/like`);
      
      console.log('👍 CommunityApi: Comment like toggled:', response.data?.message);
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error toggling comment like:', error);
      throw error;
    }
  }

  /**
   * Update a post (owner only)
   * @param {string} postId - Post UUID
   * @param {string} content - Updated content
   * @param {Array<string>} mediaUrls - Optional media URLs
   * @returns {Promise<Object>} Updated post data
   */
  async updatePost(postId, content, mediaUrls = null) {
    try {
      console.log('✏️ CommunityApi: Updating post...', { postId, content, mediaUrls });
      
      const body = { content };
      if (mediaUrls) {
        body.mediaUrls = mediaUrls;
      }
      
      const response = await api.put(`/community/posts/${postId}`, body);
      
      console.log('✏️ CommunityApi: Post updated successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error updating post:', error);
      throw error;
    }
  }

  /**
   * Delete a post (owner only)
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Success response
   */
  async deletePost(postId) {
    try {
      console.log('🗑️ CommunityApi: Deleting post...', postId);
      
      const response = await api.delete(`/community/posts/${postId}`);
      
      console.log('🗑️ CommunityApi: Post deleted successfully');
      
      return response.data;
    } catch (error) {
      console.error('❌ CommunityApi: Error deleting post:', error);
      throw error;
    }
  }
}

export default new CommunityApi(); 