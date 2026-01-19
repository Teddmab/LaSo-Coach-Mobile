import api from './api';
import * as ugcTermsService from './ugcTermsService';
import { firebaseAuthService } from './firebaseAuthServiceNew';

// Types pour les fichiers
interface FileData {
  uri: string;
  type?: string;
  name?: string;
}

// Type pour les erreurs API
interface ApiError extends Error {
  response?: {
    status?: number;
    statusText?: string;
    data?: any;
  };
  userMessage?: string;
}

class CommunityApi {
  /**
   * Get all posts with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 10)
   * @returns {Promise<Object>} Response with posts and pagination
   */
  async getPosts(page = 1, limit = 10) {
    try {
      // Inclure les données utilisateur et les likes dans la réponse
      // Le backend peut utiliser Prisma (include) ou Sequelize (include) pour joindre les données
      const response = await api.get(`/community/posts?page=${page}&limit=${limit}&include=user,likes`);
      
      // API returns: { status: "success", data: { posts: [...], pagination: {...} } }
      // Les posts devraient maintenant inclure les données utilisateur (user: { id, firstName, name, avatar })
      
      // Log pour debug: vérifier la structure de la réponse
      if (response.data?.data?.posts && response.data.data.posts.length > 0) {
        const firstPost = response.data.data.posts[0];
        console.log('📋 Structure du premier post:', {
          postId: firstPost.id,
          hasUser: !!firstPost.user,
          userKeys: firstPost.user ? Object.keys(firstPost.user) : [],
          userData: firstPost.user,
          allKeys: Object.keys(firstPost),
        });
      }
      
      return response.data;
    } catch (error: unknown) {
      // Si le paramètre include=user n'est pas supporté, essayer sans
      // Certains backends peuvent utiliser d'autres paramètres comme populate=user
      const apiError = error as ApiError;
      
      // Handle 401 (unauthorized) - token might be expired, will be retried by interceptor
      if (apiError.response?.status === 401) {
        console.warn('⚠️ [CommunityApi] Unauthorized (401) - token may be expired, will retry');
        // Re-throw to let the interceptor handle token refresh
        throw error;
      }
      
      // Handle 403 (Forbidden) - user may not have accepted UGC terms
      if (apiError.response?.status === 403) {
        const errorMessage = apiError.response?.data?.message || '';
        const errorData = apiError.response?.data || {};
        
        // Log full error details for debugging
        console.warn('⚠️ [CommunityApi] 403 Forbidden detected:', {
          message: errorMessage,
          fullErrorData: JSON.stringify(errorData, null, 2),
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
        });
        
        const isUgcError = errorMessage.includes('UGC') || 
                          errorMessage.includes('terms') || 
                          errorMessage.includes('guidelines') ||
                          errorMessage.toLowerCase().includes('accept') ||
                          errorMessage.toLowerCase().includes('community');
        
        if (isUgcError) {
          console.warn('⚠️ [CommunityApi] 403 Forbidden - UGC terms not accepted on backend');
          // Throw error so caller can handle it (e.g., show UGC modal)
          // Don't return empty result - let the caller decide what to do
          apiError.userMessage = 'Vous devez accepter les règles de la communauté pour accéder aux posts.';
        } else {
          console.warn('⚠️ [CommunityApi] 403 Forbidden - access denied (not UGC related)');
          apiError.userMessage = apiError.response?.data?.message || 'Accès refusé.';
        }
        // Re-throw the error so caller can handle it
        throw apiError;
      }
      
      // Handle 400 or 404 - try without include parameter
      if (apiError.response?.status === 400 || apiError.response?.status === 404) {
        console.warn('⚠️ [CommunityApi] Paramètre include non supporté, tentative sans paramètre');
        try {
        const fallbackResponse = await api.get(`/community/posts?page=${page}&limit=${limit}`);
        return fallbackResponse.data;
        } catch (fallbackError) {
          // If fallback also fails, return empty result instead of crashing
          console.warn('⚠️ [CommunityApi] Fallback request also failed, returning empty posts');
          return { data: { posts: [], pagination: {} } };
        }
      }
      
      // For other errors, throw to let caller handle
      throw error;
    }
  }

  /**
   * Get single post by ID
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Post data
   */
  async getPost(postId: string) {
    try {
      // Inclure les données utilisateur et les likes dans la réponse
      const response = await api.get(`/community/posts/${postId}?include=user,likes`);
      
      // API returns: { status: "success", data: { post: {...} } }
      // Le post devrait maintenant inclure les données utilisateur et les likes
      
      return response.data;
    } catch (error: unknown) {
      // Si le paramètre include n'est pas supporté, essayer sans
      const apiError = error as ApiError;
      if (apiError.response?.status === 400 || apiError.response?.status === 404) {
        const fallbackResponse = await api.get(`/community/posts/${postId}`);
        return fallbackResponse.data;
      }
      throw error;
    }
  }

  /**
   * Create a new post
   * @param {string} content - Post content (Markdown supported)
   * @param {Array<FileData>} files - Optional media files
   * @returns {Promise<Object>} Created post data
   */
  async createPost(content: string, files: FileData[] = []) {
    try {
      // Pre-check UGC acceptance with backend to avoid 403 errors (as per API contract)
      try {
        const currentUser = firebaseAuthService.getCurrentUser();
        const userId = currentUser?.id || currentUser?.uid || null;
        const ugcStatus = await ugcTermsService.getUgcAcceptanceFromBackend(userId);
        if (!ugcStatus.accepted) {
          const error = new Error('UGC terms not accepted') as ApiError;
          error.response = { status: 403, data: { message: 'UGC terms must be accepted before creating posts' } };
          error.userMessage = 'Vous devez accepter les règles de la communauté pour publier.';
          throw error;
        }
      } catch (preCheckError: any) {
        // If pre-check fails with 403, re-throw it
        if (preCheckError.response?.status === 403 || preCheckError.userMessage) {
          throw preCheckError;
        }
        // If pre-check fails for other reasons (network, etc.), continue anyway
        // The backend will still enforce the check and return 403 if needed
        console.warn('⚠️ [CommunityApi] Pre-check UGC status failed, continuing anyway:', preCheckError.message);
      }
      // Backend accepts either text, image, or both
      // Field name must be 'media' (not 'files', 'image', or 'photo')
      // Use FormData with fetch for file uploads (standard React Native approach)
      // Note: The api instance automatically adds Authorization header via interceptor
      
      if (files.length > 0) {
        // Use FormData for multipart/form-data uploads
        // CRITICAL: Keep file:// prefix - fetch needs it to access the file on React Native
        const formData = new FormData();
        
        // Add content if provided
        if (content && content.trim()) {
          formData.append('content', content.trim());
        }
        
        // Add images with field name 'media' (backend expects this exact name with multer.array('media', 5))
        files.forEach((file, index) => {
          // Normalize MIME type
          let fileType = file.type || 'image/jpeg';
          if (fileType === 'image/jpg' || fileType === 'jpg' || fileType === 'jpeg') {
            fileType = 'image/jpeg';
          } else if (fileType === 'image/png' || fileType === 'png') {
            fileType = 'image/png';
          } else if (file.name && file.name.toLowerCase().endsWith('.png')) {
            fileType = 'image/png';
          } else if (file.name && (file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg'))) {
            fileType = 'image/jpeg';
          } else {
            fileType = 'image/jpeg';
          }
          
          const fileName = file.name || `post_${Date.now()}_${index}.jpg`;
          
          // CRITICAL: Keep file:// prefix - fetch needs it to access the file on React Native
          // Removing it causes Network Error because fetch can't find the file
          formData.append('media', {
            uri: file.uri, // Keep file:// prefix
            type: fileType,
            name: fileName,
          } as any);
        });
        
        // Use fetch with FormData for upload (via api instance)
        // The api instance interceptor automatically:
        // - Adds Authorization header with Firebase ID token
        // - Removes Content-Type header for FormData (fetch/browser sets it with boundary)
        const response = await api.post('/community/posts', formData);
        
          // Backend returns: { status: "success", data: { id, content, mediaUrls, user, ... } }
        const postData = response.data?.data || response.data;
          return postData;
      } else {
        // JSON request for text-only posts
        // Content is required for text-only posts
        if (!content || !content.trim()) {
          throw new Error('Le contenu de la publication ou l\'image ne peut pas être vide.');
        }
        
        const response = await api.post('/community/posts', { content: content.trim() });
        
        // Backend returns: { status: "success", data: { id, content, mediaUrls, user, ... } }
        const postData = response.data?.data || response.data;
        return postData;
      }
    } catch (error: unknown) {
      // Extract user-friendly error message from backend response
      const apiError = error as ApiError;
      
      // Handle 403 (Forbidden) - user may not have accepted UGC terms
      if (apiError.response?.status === 403) {
        const errorMessage = apiError.response?.data?.message || '';
        if (errorMessage.includes('UGC') || errorMessage.includes('terms') || errorMessage.includes('guidelines')) {
          console.warn('⚠️ [CommunityApi] 403 Forbidden - UGC terms not accepted on backend when creating post');
          apiError.userMessage = 'Vous devez accepter les règles de la communauté pour publier. Veuillez accepter les termes UGC.';
        } else {
          console.warn('⚠️ [CommunityApi] 403 Forbidden - access denied when creating post');
          apiError.userMessage = apiError.response?.data?.message || 'Vous n\'avez pas l\'autorisation de publier ce contenu.';
        }
      } else if (apiError.response?.data?.message) {
        apiError.userMessage = apiError.response.data.message;
      } else if (apiError.message) {
        apiError.userMessage = apiError.message;
      }
      
      throw apiError;
    }
  }

  /**
   * Toggle like on a post (like if not liked, unlike if already liked)
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Response with success message
   */
  async toggleLikePost(postId: string) {
    try {
      
      const response = await api.post(`/community/posts/${postId}/like`);
      
      // API returns: { status: "success", message: "Post liked successfully" } or "Post unliked successfully"
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * @deprecated Use toggleLikePost instead - API uses toggle endpoint
   * Alias for toggleLikePost for backward compatibility
   */
  async likePost(postId: string) {
    return this.toggleLikePost(postId);
  }

  /**
   * Add a comment to a post
   * @param {string} postId - Post UUID
   * @param {string} content - Comment content (Markdown supported)
   * @returns {Promise<Object>} Created comment data
   */
  async addComment(postId: string, content: string) {
    try {
      // Pre-check UGC acceptance with backend to avoid 403 errors (as per API contract)
      try {
        const currentUser = firebaseAuthService.getCurrentUser();
        const userId = currentUser?.id || currentUser?.uid || null;
        const ugcStatus = await ugcTermsService.getUgcAcceptanceFromBackend(userId);
        if (!ugcStatus.accepted) {
          const error = new Error('UGC terms not accepted') as ApiError;
          error.response = { status: 403, data: { message: 'UGC terms must be accepted before creating comments' } };
          error.userMessage = 'Vous devez accepter les règles de la communauté pour commenter.';
          throw error;
        }
      } catch (preCheckError: any) {
        // If pre-check fails with 403, re-throw it
        if (preCheckError.response?.status === 403 || preCheckError.userMessage) {
          throw preCheckError;
        }
        // If pre-check fails for other reasons (network, etc.), continue anyway
        // The backend will still enforce the check and return 403 if needed
        console.warn('⚠️ [CommunityApi] Pre-check UGC status failed for comment, continuing anyway:', preCheckError.message);
      }
      
      const response = await api.post(`/community/posts/${postId}/comments`, {
        content
      });
      
      // API returns: { status: "success", data: { id, content, user, ... } }
      
      return response.data;
    } catch (error) {
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
  async getComments(postId: string, page = 1, limit = 10) {
    try {
      // Inclure les données utilisateur dans la réponse
      const response = await api.get(`/community/posts/${postId}/comments?page=${page}&limit=${limit}&include=user`);
      
      // API returns: { status: "success", data: { comments: [...], pagination: {...} } }
      // Les commentaires devraient maintenant inclure les données utilisateur (user: { id, firstName, name, avatar })
      
      // Log pour debug: vérifier la structure de la réponse
      if (response.data?.data?.comments && response.data.data.comments.length > 0) {
        const firstComment = response.data.data.comments[0];
        console.log('💬 Structure du premier commentaire:', {
          commentId: firstComment.id,
          hasUser: !!firstComment.user,
          userKeys: firstComment.user ? Object.keys(firstComment.user) : [],
          userData: firstComment.user,
          allKeys: Object.keys(firstComment),
        });
      }
      
      return response.data;
    } catch (error: unknown) {
      // Si le paramètre include=user n'est pas supporté, essayer sans
      const apiError = error as ApiError;
      if (apiError.response?.status === 400 || apiError.response?.status === 404) {
        console.warn('⚠️ Paramètre include=user non supporté pour les commentaires, tentative sans paramètre');
        const fallbackResponse = await api.get(`/community/posts/${postId}/comments?page=${page}&limit=${limit}`);
        return fallbackResponse.data;
      }
      throw error;
    }
  }

  /**
   * Delete a comment
   * @param {string} commentId - Comment UUID
   * @returns {Promise<Object>} Success response
   */
  async deleteComment(commentId: string) {
    try {
      
      const response = await api.delete(`/community/comments/${commentId}`);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle like on a comment
   * @param {string} commentId - Comment UUID
   * @returns {Promise<Object>} Response with success message
   */
  async toggleLikeComment(commentId: string) {
    try {
      
      const response = await api.post(`/community/comments/${commentId}/like`);
      
      
      return response.data;
    } catch (error) {
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
  async updatePost(postId: string, content: string, mediaUrls: string[] | null = null) {
    try {
      
      const body: { content: string; mediaUrls?: string[] } = { content };
      if (mediaUrls) {
        body.mediaUrls = mediaUrls;
      }
      
      const response = await api.put(`/community/posts/${postId}`, body);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a post (owner only)
   * @param {string} postId - Post UUID
   * @returns {Promise<Object>} Success response
   */
  async deletePost(postId: string) {
    try {
      
      const response = await api.delete(`/community/posts/${postId}`);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Report a post (signal a post for moderation)
   * @param {string} postId - Post UUID
   * @param {string} reason - Reason for reporting the post
   * @returns {Promise<Object>} Success response
   */
  async reportPost(postId: string, reason: string) {
    try {
      
      const response = await api.post(`/community/posts/${postId}/report`, {
        reason
      });
      
      // API returns: { status: "success", message: "Post reported successfully" }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new CommunityApi(); 