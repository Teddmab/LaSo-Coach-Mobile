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
    } catch (error: any) {
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
  static async addProgressPhoto(formData: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
  static getPhotoUrl(photo: any) {
    if (!photo || !photo.url) return null;
    
    // If URL is already absolute, return as is
    if (photo.url.startsWith('http')) {
      return photo.url;
    }
    
    // If URL is relative, prepend base URL
    const baseURL = API_CONFIG.BASE_URL?.replace('/api/v1', '') || '';
    return `${baseURL}${photo.url}`;
  }

  /**
   * Validate photo file
   * @param {Object} photo - Photo file object (asset from ImagePicker)
   * @returns {Object} Validation result
   */
  static validatePhoto(photo: any) {
    const errors: string[] = [];
    
    console.log('🔍 Validation photo:', {
      hasPhoto: !!photo,
      photoKeys: photo ? Object.keys(photo) : [],
      uri: photo?.uri ? photo.uri.substring(0, 50) + '...' : 'none',
      type: photo?.type,
      mimeType: photo?.mimeType,
      fileName: photo?.fileName,
      fileSize: photo?.fileSize
    });
    
    if (!photo) {
      errors.push('Aucune photo sélectionnée');
      return { isValid: false, errors };
    }
    
    // Check file type - ImagePicker asset peut avoir 'type' ou 'mimeType'
    // CRITICAL: Parfois ImagePicker retourne juste "image" sans le sous-type
    // Il faut extraire le type complet depuis l'URI ou le fileName
    let photoType = photo.type || photo.mimeType || '';
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    // Si le type est juste "image" sans sous-type, essayer de le déterminer depuis l'URI ou fileName
    if (photoType === 'image' || photoType === '') {
      console.log('⚠️ Type MIME incomplet ou manquant, détermination depuis URI/fileName...');
      const uri = photo.uri || '';
      const fileName = photo.fileName || photo.name || '';
      
      // Déterminer le type depuis l'extension du fichier
      if (uri.match(/\.(png)$/i) || fileName.match(/\.(png)$/i)) {
        photoType = 'image/png';
        console.log('✅ Type déterminé depuis extension: image/png');
      } else if (uri.match(/\.(jpg|jpeg)$/i) || fileName.match(/\.(jpg|jpeg)$/i)) {
        photoType = 'image/jpeg';
        console.log('✅ Type déterminé depuis extension: image/jpeg');
      } else if (uri.match(/\.(gif)$/i) || fileName.match(/\.(gif)$/i)) {
        photoType = 'image/gif';
        console.log('✅ Type déterminé depuis extension: image/gif');
      } else if (uri.match(/\.(webp)$/i) || fileName.match(/\.(webp)$/i)) {
        photoType = 'image/webp';
        console.log('✅ Type déterminé depuis extension: image/webp');
      } else {
        // Par défaut, on assume JPEG si c'est un URI file:// (fichier copié)
        if (uri.startsWith('file://')) {
          photoType = 'image/jpeg';
          console.log('✅ Type par défaut (file:// URI): image/jpeg');
        }
      }
    }
    
    // Si on a un type, vérifier qu'il est autorisé
    if (photoType) {
      const normalizedType = photoType.toLowerCase();
      if (!allowedTypes.includes(normalizedType)) {
        console.warn('⚠️ Type MIME non autorisé:', normalizedType);
        // Si c'est juste "image" sans sous-type, ne pas bloquer (le backend validera)
        if (normalizedType !== 'image') {
          errors.push('Veuillez sélectionner une image valide (JPEG ou PNG)');
        } else {
          console.log('ℹ️ Type "image" détecté, on continue (backend validera)');
        }
      } else {
        console.log('✅ Type MIME valide:', normalizedType);
      }
    } else {
      // Si pas de type mais qu'on a un URI, on accepte (le backend validera)
      console.log('⚠️ Pas de type MIME détecté, validation par URI');
      const uri = photo.uri || '';
      if (!uri) {
        errors.push('URI de l\'image manquante');
      } else {
        // Vérifier l'extension du fichier dans l'URI
        // Les fichiers copiés peuvent avoir des noms génériques, donc on accepte si c'est un URI file://
        const isFileUri = uri.startsWith('file://');
        const isImageUri = uri.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        
        if (isFileUri) {
          // Si c'est un URI file:// (fichier copié), on accepte même sans extension visible
          // car le type est défini dans le FormData
          console.log('✅ URI file:// détecté (fichier copié), validation acceptée');
        } else if (isImageUri) {
          console.log('✅ Extension de fichier valide détectée dans URI');
        } else {
          console.warn('⚠️ Extension de fichier non reconnue dans URI:', uri.substring(0, 50));
          // Ne pas bloquer - le backend validera et on a déjà le type dans le FormData
          console.log('ℹ️ Validation par URI échouée mais on continue (backend validera)');
        }
      }
    }
    
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (photo.fileSize && photo.fileSize > maxSize) {
      errors.push('L\'image ne doit pas dépasser 5MB');
    }
    
    const isValid = errors.length === 0;
    console.log('🔍 Résultat validation:', { isValid, errors });
    
    return {
      isValid,
      errors
    };
  }

  /**
   * Create form data for photo upload
   * @param {Object} photo - Photo file object (asset from ImagePicker avec URI accessible)
   * @param {Object} metadata - Additional metadata
   * @returns {FormData} Form data object
   */
  static createFormData(photo: any, metadata: Record<string, any> = {}) {
    const formData = new FormData();
    
    // CRITICAL: Utiliser l'URI accessible (file://) et le type MIME correct
    // L'URI doit être accessible (copié via copyFileToAccessibleLocation)
    const photoUri = photo.uri;
    const photoType = photo.type || photo.mimeType || 'image/jpeg';
    const photoName = photo.fileName || photo.name || `progress_${Date.now()}.jpg`;
    
    console.log('📤 Création FormData pour upload:', {
      uri: photoUri.substring(0, 50) + '...',
      uriType: photoUri.startsWith('file://') ? 'file://' : 
               photoUri.startsWith('content://') ? 'content://' : 'unknown',
      type: photoType,
      name: photoName
    });
    
    // Add photo file (React Native FormData accepts uri/type/name objects)
    (formData as any).append('photo', {
      uri: photoUri,
      type: photoType,
      name: photoName,
    });

    // Add metadata
    if (metadata.weight) {
      formData.append('weight', String(parseFloat(metadata.weight)));
    }

    if (metadata.notes) {
      formData.append('notes', String(metadata.notes));
    }

    if (metadata.date) {
      formData.append('date', String(metadata.date));
    } else {
      formData.append('date', new Date().toISOString());
    }
    
    return formData;
  }
}

export default ProgressPhotosApi;
