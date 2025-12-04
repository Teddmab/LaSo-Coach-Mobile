import api from './api';
import { API_CONFIG } from '../config/apiConfig';

/**
 * Progress Photos API Service
 * Handles all progress photos related API calls
 */
class ProgressPhotosApi {
  /**
   * Get user progress photos
   * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
   */
  static async getProgressPhotos() {
    try {
      console.log('📸 ProgressPhotosApi: Fetching progress photos...');
      console.log('🌐 API Endpoint:', '/api/v1/progress-photos');
      
      const response = await api.get('/progress-photos');
      
      console.log('✅ ProgressPhotosApi: Progress photos fetched successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data || []
      };
    } catch (error) {
      console.error('❌ ProgressPhotosApi: Error fetching progress photos:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to fetch progress photos'
      };
    }
  }

  /**
   * Add a new progress photo
   * @param {FormData} formData - Form data containing photo and metadata
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async addProgressPhoto(formData) {
    try {
      console.log('📸 ProgressPhotosApi: Adding new progress photo...');
      console.log('🌐 API Endpoint:', '/api/v1/progress-photos');
      
      const response = await api.post('/progress-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ ProgressPhotosApi: Progress photo added successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('❌ ProgressPhotosApi: Error adding progress photo:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to add progress photo'
      };
    }
  }

  /**
   * Delete a progress photo
   * @param {string} photoId - Photo ID
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async deleteProgressPhoto(photoId) {
    try {
      console.log('📸 ProgressPhotosApi: Deleting progress photo...');
      console.log('📊 Photo ID:', photoId);
      console.log('🌐 API Endpoint:', `/api/v1/progress-photos/${photoId}`);
      
      const response = await api.delete(`/progress-photos/${photoId}`);
      
      console.log('✅ ProgressPhotosApi: Progress photo deleted successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('❌ ProgressPhotosApi: Error deleting progress photo:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to delete progress photo'
      };
    }
  }

  /**
   * Update a progress photo
   * @param {string} photoId - Photo ID
   * @param {Object} updateData - Updated photo data
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  static async updateProgressPhoto(photoId, updateData) {
    try {
      console.log('📸 ProgressPhotosApi: Updating progress photo...');
      console.log('📊 Photo ID:', photoId);
      console.log('📊 Updated data:', updateData);
      console.log('🌐 API Endpoint:', `/api/v1/progress-photos/${photoId}`);
      
      const response = await api.put(`/progress-photos/${photoId}`, updateData);
      
      console.log('✅ ProgressPhotosApi: Progress photo updated successfully');
      console.log('📊 Response data:', response.data);
      
      return {
        success: true,
        data: response.data?.data || response.data
      };
    } catch (error) {
      console.error('❌ ProgressPhotosApi: Error updating progress photo:', error);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.message || 'Failed to update progress photo'
      };
    }
  }

  /**
   * Get photo URL (handle both relative and absolute URLs)
   * @param {Object} photo - Photo object
   * @returns {string|null} Photo URL or null
   */
  static getPhotoUrl(photo) {
    if (!photo || !photo.url) return null;
    
    // If URL is already absolute, return as is
    if (photo.url.startsWith('http')) {
      return photo.url;
    }
    
    // If URL is relative, prepend base URL
    const baseURL = API_CONFIG.baseURL?.replace('/api/v1', '') || '';
    return `${baseURL}${photo.url}`;
  }

  /**
   * Validate photo file
   * @param {Object} photo - Photo file object
   * @returns {Object} Validation result
   */
  static validatePhoto(photo) {
    const errors = [];
    
    if (!photo) {
      errors.push('Aucune photo sélectionnée');
      return { isValid: false, errors };
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (photo.type && !allowedTypes.includes(photo.type.toLowerCase())) {
      errors.push('Veuillez sélectionner une image valide (JPEG ou PNG)');
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (photo.fileSize && photo.fileSize > maxSize) {
      errors.push('L\'image ne doit pas dépasser 5MB');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create form data for photo upload
   * @param {Object} photo - Photo file object
   * @param {Object} metadata - Additional metadata
   * @returns {FormData} Form data object
   */
  static createFormData(photo, metadata = {}) {
    const formData = new FormData();
    
    // Add photo file
    formData.append('photo', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || 'photo.jpg'
    });
    
    // Add metadata
    if (metadata.weight) {
      formData.append('weight', parseFloat(metadata.weight));
    }
    
    if (metadata.notes) {
      formData.append('notes', metadata.notes);
    }
    
    if (metadata.date) {
      formData.append('date', metadata.date);
    } else {
      formData.append('date', new Date().toISOString());
    }
    
    return formData;
  }
}

export default ProgressPhotosApi;
