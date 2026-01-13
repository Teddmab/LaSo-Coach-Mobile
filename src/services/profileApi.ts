import api from './api';
import { AxiosResponse } from 'axios';
import Config from '../config/env';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Profile API Service
 * Handles all API calls related to user profile management
 */
export class ProfileApi {
  /**
   * Get user profile data
   * @returns {Promise<Object>} User profile data
   */
  static async getProfile() {
    try {
      const response = await api.get('/profile');
      
      
      return response.data.data || response.data;
    } catch (error: any) {
      // Log detailed error information for debugging
      if (__DEV__) {
        console.error('❌ [ProfileApi] Error fetching profile:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.response?.data?.message || error.message,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
      
      // If 400 error, it might be a validation issue or missing data
      // Don't crash the app, return null or empty object
      if (error.response?.status === 400) {
        console.warn('⚠️ [ProfileApi] 400 Bad Request - Profile endpoint returned error');
        console.warn('⚠️ [ProfileApi] This might indicate missing profile data or validation issue');
        // Return null to allow app to continue
        return null;
      }
      
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   * @returns {Promise<Object>} Updated profile data
   */
  static async updateProfile(profileData) {
    try {

      // Récupérer le token Firebase pour l'authentification
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();

      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const url = `${Config.API_BASE_URL}/profile`;

      const response = await fetch(url, {
        method: 'PUT', // Utiliser PUT comme la version web (ProfileSetup.tsx ligne 361)
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(profileData),
      });

      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
      }

      if (!response.ok) {
        const message = json?.message || `Erreur lors de la mise à jour du profil (code ${response.status})`;
        const error: any = new Error(message);
        error.status = response.status;
        error.data = json;
        throw error;
      }


      // Retourner la réponse complète pour vérification
      return json;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Copy file from content:// URI to accessible file:// URI (Android fix)
   * This solves the "Network request failed" error on Android
   * @param {string} sourceUri - Source URI (content:// or file://)
   * @param {string} mimeType - MIME type of the file
   * @returns {Promise<string>} Accessible file URI
   */
  static async copyFileToAccessibleLocation(sourceUri, mimeType = 'image/jpeg') {
    try {
      // If already a file:// URI that's accessible, return as-is
      if (sourceUri.startsWith('file://')) {
        // Verify the file exists
        const fileInfo = await FileSystem.getInfoAsync(sourceUri);
        if (fileInfo.exists) {
          return sourceUri;
        }
        // If file doesn't exist, continue to copy it
      }

      // On iOS, ImagePicker may return ph:// or assets-library:// URIs
      // On Android, it may return content:// URIs
      // Both need to be copied to an accessible location
      const needsCopy = sourceUri.startsWith('content://') || 
                       sourceUri.startsWith('ph://') || 
                       sourceUri.startsWith('assets-library://') ||
                       (!sourceUri.startsWith('file://'));
      
      if (needsCopy) {
        // Determine file extension from mime type
        const extension = mimeType.includes('png') ? 'png' : 
                         mimeType.includes('gif') ? 'gif' : 
                         'jpg';
        
        // Create a unique filename in cache directory
        const fileName = `avatar_${Date.now()}.${extension}`;
        // CRITICAL: FileSystem.cacheDirectory may or may not include file:// prefix
        // We need to ensure it has file:// prefix for axios to access it
        let cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir.startsWith('file://')) {
          cacheDir = `file://${cacheDir}`;
        }
        const destUri = `${cacheDir}${fileName}`;
        
        console.log('📁 Copying file for upload:', {
          platform: Platform.OS,
          sourceUri: sourceUri.substring(0, 50) + '...',
          sourceType: sourceUri.startsWith('ph://') ? 'ph:// (iOS Photo Library)' :
                     sourceUri.startsWith('assets-library://') ? 'assets-library:// (iOS)' :
                     sourceUri.startsWith('content://') ? 'content:// (Android)' :
                     sourceUri.startsWith('file://') ? 'file://' : 'unknown',
          destUri: destUri.substring(0, 50) + '...',
        });
        
        // Copy the file using expo-file-system
        await FileSystem.copyAsync({
          from: sourceUri,
          to: destUri,
        });
        
        // Verify file exists after copy
        const fileInfo = await FileSystem.getInfoAsync(destUri);
        if (!fileInfo.exists) {
          throw new Error('Failed to copy file to accessible location');
        }
        
        console.log('✅ File copied successfully:', {
          destUri: destUri.substring(0, 50) + '...',
          fileSize: fileInfo.size,
        });
        
        // CRITICAL: Ensure we return URI with file:// prefix for axios
        return destUri.startsWith('file://') ? destUri : `file://${destUri}`;
      }

      // Already accessible file:// URI
      return sourceUri;
    } catch (error) {
      console.error('❌ Error copying file to accessible location:', error);
      // If copy fails, return original URI as fallback
      // But log the error so we can debug
      return sourceUri;
    }
  }

  /**
   * Upload user avatar
   * @param {FormData} formData - FormData containing the avatar file
   * @returns {Promise<Object>} Upload response with avatar URL
   */
  static async uploadAvatar(formData) {
    try {
      
      // CRITICAL FIX: Use axios for file uploads - it handles content:// URIs better on Android
      // fetch() may have issues with content:// URIs on Android
      // Axios with properr FormData configuration works more reliably
      
      // Get Firebase token for authorization (axios interceptor will add it, but we log it)
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();
      
      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }
      
      // Get API base URL
      const Config = require('../config/env').default;
      
      // Web endpoint: /api/v1/profile/avatar
      // Mobile API_BASE_URL already contains /api/v1 (e.g., https://backend.com/api/v1)
      // So we use: /profile/avatar to get final URL: https://backend.com/api/v1/profile/avatar
      // This matches web: baseURL (http://localhost:5001) + /api/v1/profile/avatar
      const endpoint = '/profile/avatar';
      
      // Construct expected full URL for debugging
      const expectedFullUrl = `${Config.API_BASE_URL}${endpoint}`;
      
      
      // Log FormData contents (if possible) and verify file accessibility
      if (formData && typeof formData._parts !== 'undefined') {
        if (formData._parts && formData._parts.length > 0) {
          const firstPart = formData._parts[0];
          const fileObj = firstPart[1];
          
          // Verify file URI (non-blocking - log only)
          if (fileObj?.uri) {
            try {
              // Check if file exists (only for file:// URIs)
              if (fileObj.uri.startsWith('file://')) {
                const fileInfo = await FileSystem.getInfoAsync(fileObj.uri);
                if (fileInfo.exists) {
                  // File exists and is accessible
                } else {
                }
              } else {
              }
            } catch (fileError) {
              // Non-blocking: just log the error but continue
            }
          }
        }
      }
      
      // CRITICAL: Verify FormData structure before sending
      if (!formData || typeof formData.append !== 'function') {
        throw new Error('FormData is not valid');
      }
      
      // Verify file object in FormData exists (required)
      if (formData._parts && formData._parts.length > 0) {
        const fileObj = formData._parts[0][1];
        if (!fileObj || !fileObj.uri) {
          throw new Error('FormData file object is missing URI');
        }
        
        // CRITICAL: Verify file exists and is accessible before sending
        // This prevents Network Error from trying to upload non-existent files
        if (fileObj.uri.startsWith('file://')) {
          try {
            const fileInfo = await FileSystem.getInfoAsync(fileObj.uri);
            if (!fileInfo.exists) {
              throw new Error(`Le fichier n'existe pas à l'URI: ${fileObj.uri.substring(0, 50)}...`);
            }
            
            // CRITICAL: On React Native, axios may need the URI without file:// prefix
            // But we also need to ensure the file is accessible
            // Try to read a small portion to verify accessibility
            try {
              const fileContent = await FileSystem.readAsStringAsync(fileObj.uri, {
                encoding: FileSystem.EncodingType.Base64,
                length: 100 // Just read first 100 bytes to verify
              });
            } catch (readError) {
            }
          } catch (fileError) {
            throw new Error('Le fichier sélectionné n\'est pas accessible. Veuillez réessayer.');
          }
        }
      }
      
      // Verify axios configuration
      // Use axios - the interceptor will handle Content-Type correctly
      // Use the same endpoint path as web app: /profile/avatar
      // Final URL should be: {API_BASE_URL}/profile/avatar = {API_BASE_URL}/api/v1/profile/avatar (since API_BASE_URL contains /api/v1)
      
      // CRITICAL FIX: Use axios like other working uploads (communityApi, progressPhotosApi)
      // The interceptor in api.js already handles FormData correctly by removing Content-Type
      // This is the same pattern used successfully in communityApi.js and progressPhotosApi.js
      
      // Log FormData structure one more time before sending
      
      // CRITICAL FIX: Use react-native-blob-util for PATCH FormData uploads
      // This library is specifically designed for file uploads on React Native
      // and handles multipart/form-data much better than axios or XMLHttpRequest
      const fullUrl = `${Config.API_BASE_URL}${endpoint}`;
      
      // Extract file info from FormData
      let fileUri, fileName, fileType;
      if (formData._parts && formData._parts.length > 0) {
        const fileObj = formData._parts[0][1];
        fileUri = fileObj.uri;
        fileName = fileObj.name;
        
        // CRITICAL: Normalize MIME type to match multer expectations
        // Multer expects exactly 'image/jpeg' or 'image/png'
        let rawType = fileObj.type || 'image/jpeg';
        
        // Normalize common variations
        if (rawType === 'image/jpg' || rawType === 'jpg' || rawType === 'jpeg') {
          fileType = 'image/jpeg';
        } else if (rawType === 'image/png' || rawType === 'png') {
          fileType = 'image/png';
        } else if (fileName.toLowerCase().endsWith('.png')) {
          fileType = 'image/png';
        } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
          fileType = 'image/jpeg';
        } else {
          // Default to jpeg if unknown
          fileType = 'image/jpeg';
        }
      } else {
        throw new Error('FormData does not contain file information');
      }
      
      // react-native-blob-util requires file path without file:// prefix on both iOS and Android
      // CRITICAL: Remove file:// prefix for ReactNativeBlobUtil.wrap() to work correctly
      let filePath = fileUri;
      if (filePath.startsWith('file://')) {
        filePath = filePath.replace('file://', '');
      }
      
      try {
        // Use react-native-blob-util for upload
        // This library handles multipart/form-data correctly for all HTTP methods including PATCH
        // CRITICAL: Ensure MIME type is correctly set - multer checks file.mimetype
        // Syntax: ReactNativeBlobUtil.fetch(method, url, headers, formData)
        const response = await ReactNativeBlobUtil.fetch(
          'PATCH',
          fullUrl,
          {
            'Authorization': `Bearer ${idToken}`,
            // Do NOT set Content-Type - react-native-blob-util will set it with boundary
          },
          [
            {
              name: 'avatar', // Field name (must match backend expectation: 'avatar')
              filename: fileName, // File name with extension
              type: fileType, // MIME type: MUST be exactly 'image/jpeg' or 'image/png' for multer
              contentType: fileType, // Also set contentType explicitly (some versions need this)
              data: ReactNativeBlobUtil.wrap(filePath), // Wrap file path for upload
            },
          ]
        );
        
        
        const responseData = response.json();
        
        if (response.info().status >= 200 && response.info().status < 300) {
          return responseData;
        } else {
          const error = new Error(responseData.message || 'Upload failed');
          error.response = {
            status: response.info().status,
            statusText: response.info().statusText || '',
            data: responseData
          };
          throw error;
        }
      } catch (uploadError) {
        
        // Handle timeout errors
        if (uploadError.message?.includes('timeout') || uploadError.message?.includes('TIMEOUT')) {
          const timeoutError = new Error('Le téléchargement prend trop de temps. Vérifiez votre connexion internet ou essayez avec une image plus petite.');
          timeoutError.code = 'ECONNABORTED';
          throw timeoutError;
        }
        
        // Handle network errors
        if (uploadError.message?.includes('Network') || uploadError.message?.includes('network')) {
          const networkError = new Error('Erreur de connexion ou fichier inaccessible. Vérifiez votre connexion internet et réessayez.');
          networkError.code = 'ERR_NETWORK';
          throw networkError;
        }
        
        // Re-throw other errors
        throw uploadError;
      }
    } catch (error) {
      // This catch block is for errors before the XHR request
      // Provide more detailed error information
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new Error('Le téléchargement prend trop de temps. Vérifiez votre connexion internet ou essayez avec une image plus petite.');
      }
      
      if (error.message?.includes('Network Error') || error.message?.includes('Network request failed') || (!error.response && !error.request)) {
        throw new Error('Erreur de connexion ou fichier inaccessible. Vérifiez votre connexion internet et réessayez.');
      }
      
      // Handle server errors
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        let errorMessage = 'Erreur lors du téléchargement de l\'avatar';
        
        if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (errorData?.error) {
          errorMessage = errorData.error;
        } else if (status === 413) {
          errorMessage = 'L\'image est trop volumineuse. Veuillez choisir une image plus petite.';
        } else if (status === 400) {
          errorMessage = 'Format d\'image non supporté. Utilisez JPG ou PNG.';
        } else if (status === 401) {
          errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        }
        
        throw new Error(errorMessage);
      }
      
      // If error has a message, use it; otherwise use generic message
      throw error.message ? error : new Error('Erreur lors du téléchargement de l\'avatar');
    }
  }

  /**
   * Get onboarding measurements
   * @returns {Promise<Object>} Measurements data
   */
  static async getMeasurements() {
    try {
      const response = await api.get('/onboarding/measurements');
      
      
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new measurement entry
   * @param {Object} measurementData - Measurement data
   * @returns {Promise<Object>} Created measurement data
   */
  static async createMeasurement(measurementData) {
    try {
      
      const response = await api.post('/onboarding/measurements', measurementData);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete measurement entry
   * @param {string} measurementId - ID of measurement to delete
   * @returns {Promise<Object>} Delete response
   */
  static async deleteMeasurement(measurementId) {
    try {
      
      const response = await api.delete(`/onboarding/measurements/${measurementId}`);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get onboarding progress
   * @returns {Promise<Object>} Progress data
   */
  static async getProgress() {
    try {
      const response = await api.get('/onboarding/progress');
      
      
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update onboarding progress
   * @param {Object} progressData - Progress data to update
   * @returns {Promise<Object>} Updated progress data
   */
  static async updateProgress(progressData) {
    try {
      
      const response = await api.patch('/onboarding/progress', progressData);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Parse address string into structured object
   * @param {string} addressString - Address string in format "street; city; postalCode; country"
   * @returns {Object} Parsed address object
   */
  static parseAddress(addressString) {
    if (!addressString) return {};
    
    const parts = addressString.split(';').map(part => part.trim());
    return {
      address1: parts[0] || '', // Street
      address2: '', // No second address line in this format
      city: parts[1] || '', // City
      postalCode: parts[2] || '', // Postal code
      country: parts[3] || '' // Country
    };
  }

  /**
   * Format address object into string
   * @param {Object} address - Address object
   * @returns {string} Formatted address string
   */
  static formatAddress(address) {
    const parts = [
      address.address1 || '',
      address.address2 || '',
      address.city || '',
      address.postalCode || '',
      address.country || ''
    ];
    return parts.filter(part => part).join('; ');
  }

  /**
   * Get occupation options from backend
   * @returns {Promise<Array>} Array of occupation options
   */
  static async getOccupationOptions() {
    try {
      const response = await api.get('/profile/occupation-options');
      
      
      return response.data.data || response.data || [];
    } catch (error) {
      // Return default options if API fails
      return [
        'working',
        'not_working',
        'student',
        'unemployed'
      ];
    }
  }

  /**
   * Get current rendezvous status
   * @returns {Promise<Object>} Current rendezvous data or null
   */
  static async getCurrentRendezvous() {
    try {
      const response = await api.get('/onboarding/rendezvous/current');
      
      
      return response.data.data || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Create or update rendezvous
   * @param {Object} rendezvousData - Rendezvous data
   * @returns {Promise<Object>} Created/updated rendezvous data
   */
  static async createRendezvous(rendezvousData) {
    try {
      
      const response = await api.post('/onboarding/rendezvous', rendezvousData);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user account
   * @returns {Promise<Object>} Delete response
   */
  static async deleteAccount() {
    try {
      // Récupérer le token Firebase pour l'authentification
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();

      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const endpoint = '/profile';
      const Config = require('../config/env').default;
      const url = `${Config.API_BASE_URL}${endpoint}`;
      
      console.log('🗑️ [ProfileApi.deleteAccount] Starting account deletion...');
      console.log('📡 [ProfileApi.deleteAccount] Endpoint:', endpoint);
      console.log('📡 [ProfileApi.deleteAccount] Method: DELETE');
      console.log('📡 [ProfileApi.deleteAccount] Full URL:', url);
      console.log('📦 [ProfileApi.deleteAccount] Payload: {} (DELETE request, no body)');
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const text = await response.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        // Si ce n'est pas du JSON, on garde null
      }

      console.log('📥 [ProfileApi.deleteAccount] Response status:', response.status);
      console.log('📥 [ProfileApi.deleteAccount] Response text:', text.substring(0, 200));
      if (json) {
        console.log('📥 [ProfileApi.deleteAccount] Response data:', JSON.stringify(json, null, 2));
      }

      if (!response.ok) {
        const message = json?.message || `Erreur lors de la suppression du compte (code ${response.status})`;
        const error: any = new Error(message);
        error.status = response.status;
        error.data = json;
        console.error('❌ [ProfileApi.deleteAccount] Account deletion failed');
        console.error('❌ [ProfileApi.deleteAccount] Response status:', response.status);
        console.error('❌ [ProfileApi.deleteAccount] Response data:', JSON.stringify(json, null, 2));
        throw error;
      }

      console.log('✅ [ProfileApi.deleteAccount] Account deletion successful');
      
      // Retourner la réponse complète pour vérification
      return json || { success: true };
    } catch (error: any) {
      console.error('❌ [ProfileApi.deleteAccount] Account deletion failed');
      console.error('❌ [ProfileApi.deleteAccount] Error:', error);
      if (error.status) {
        console.error('❌ [ProfileApi.deleteAccount] Response status:', error.status);
        console.error('❌ [ProfileApi.deleteAccount] Response data:', JSON.stringify(error.data, null, 2));
      }
      throw error;
    }
  }
}

export default ProfileApi;
