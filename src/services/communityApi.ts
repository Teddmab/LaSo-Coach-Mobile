import api from './api';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform } from 'react-native';
import Config from '../config/env';
import firebaseAuthService from './firebaseAuthServiceNew';

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
    } catch (error) {
      // Si le paramètre include=user n'est pas supporté, essayer sans
      // Certains backends peuvent utiliser d'autres paramètres comme populate=user
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn('⚠️ Paramètre include non supporté, tentative sans paramètre');
        const fallbackResponse = await api.get(`/community/posts?page=${page}&limit=${limit}`);
        return fallbackResponse.data;
      }
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
      // Inclure les données utilisateur et les likes dans la réponse
      const response = await api.get(`/community/posts/${postId}?include=user,likes`);
      
      // API returns: { status: "success", data: { post: {...} } }
      // Le post devrait maintenant inclure les données utilisateur et les likes
      
      return response.data;
    } catch (error) {
      // Si le paramètre include n'est pas supporté, essayer sans
      if (error.response?.status === 400 || error.response?.status === 404) {
        const fallbackResponse = await api.get(`/community/posts/${postId}`);
        return fallbackResponse.data;
      }
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
      // Get authentication token
      const idToken = await firebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Authentication required');
      }

      // Backend accepts either text, image, or both
      // Field name must be 'media' (not 'files', 'image', or 'photo')
      // Use react-native-blob-util for file uploads (like progress photos)
      
      if (files.length > 0) {
        // Use react-native-blob-util for multipart/form-data uploads
        // Config.API_BASE_URL already contains /api/v1, so just append the endpoint
        const fullUrl = `${Config.API_BASE_URL}/community/posts`;
        
        // Prepare form data array for react-native-blob-util
        const formDataArray = [];
        
        // Add content if provided
        if (content && content.trim()) {
          formDataArray.push({
            name: 'content',
            data: content.trim(),
          });
        }
        
        // Add images with field name 'media' (backend expects this exact name with multer.array('media', 5))
        files.forEach((file, index) => {
          // CRITICAL: ReactNativeBlobUtil.wrap() requires file path without file:// prefix on both iOS and Android
          // Remove file:// prefix for ReactNativeBlobUtil to work correctly
          let filePath = file.uri;
          if (filePath.startsWith('file://')) {
            filePath = filePath.replace('file://', '');
          }
          
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
          
          formDataArray.push({
            name: 'media', // Field name must match multer.array('media', 5)
            filename: fileName,
            type: fileType,
            contentType: fileType,
            data: ReactNativeBlobUtil.wrap(filePath),
          });
        });
        
        // Use react-native-blob-util for upload
        const response = await ReactNativeBlobUtil.fetch(
          'POST',
          fullUrl,
          {
            'Authorization': `Bearer ${idToken}`,
            'Accept': 'application/json',
            // Do NOT set Content-Type - react-native-blob-util will set it with boundary
          },
          formDataArray
        );
        
        const status = response.info().status;
        const responseData = response.json();
        
        if (status >= 200 && status < 300) {
          // Backend returns: { status: "success", data: { id, content, mediaUrls, user, ... } }
          const postData = responseData?.data || responseData;
          return postData;
        } else {
          const error = new Error(responseData?.message || 'Failed to create post');
          error.response = {
            status,
            statusText: response.info().statusText || '',
            data: responseData
          };
          throw error;
        }
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
    } catch (error) {
      // Extract user-friendly error message from backend response
      if (error.response?.data?.message) {
        error.userMessage = error.response.data.message;
      } else if (error.message) {
        error.userMessage = error.message;
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
  async getComments(postId, page = 1, limit = 10) {
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
    } catch (error) {
      // Si le paramètre include=user n'est pas supporté, essayer sans
      if (error.response?.status === 400 || error.response?.status === 404) {
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
  async deleteComment(commentId) {
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
  async toggleLikeComment(commentId) {
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
  async updatePost(postId, content, mediaUrls = null) {
    try {
      
      const body = { content };
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
  async deletePost(postId) {
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
  async reportPost(postId, reason) {
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