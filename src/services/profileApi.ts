import api from './api';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

// Type pour FormData avec propriétés internes React Native
interface ReactNativeFormData extends FormData {
  _parts?: Array<[string, any]>;
}

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
      
      const profileData = response.data.data || response.data;
      
      // Ignore invalid properties from backend (e.g., subscriptionBanner, subscriptionbanner)
      // This property doesn't exist in our data model and should be ignored
      if (profileData && typeof profileData === 'object') {
        // Remove any invalid properties that might cause errors
        if ('subscriptionBanner' in profileData) {
          delete (profileData as any).subscriptionBanner;
        }
        if ('subscriptionbanner' in profileData) {
          delete (profileData as any).subscriptionbanner;
        }
      }
      
      return profileData;
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
      
      // Handle specific Prisma database errors
      const errorMessage = error.response?.data?.message || error.message || '';
      const isPrismaError = errorMessage.includes('Prisma') || 
                           errorMessage.includes('prisma') ||
                           errorMessage.includes('does not exist in the current database') ||
                           (errorMessage.includes('column') && errorMessage.includes('does not exist'));
      
      // If 400 error with Prisma database schema issue
      if (error.response?.status === 400 && isPrismaError) {
        console.warn('⚠️ [ProfileApi] 400 Bad Request - Prisma database schema error detected');
        console.warn('⚠️ [ProfileApi] Error details:', errorMessage);
        console.warn('⚠️ [ProfileApi] This indicates a backend database schema mismatch');
        console.warn('⚠️ [ProfileApi] Returning null to allow app to continue - backend needs to fix schema');
        
        // Return null to allow app to continue functioning
        // The backend needs to fix the database schema (add missing column or update Prisma schema)
        return null;
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
  static async updateProfile(profileData: any) {
    try {
      // Use api instance - interceptor automatically adds Authorization header
      const response = await api.put('/profile', profileData);

      // Retourner la réponse complète pour vérification
      return response.data?.data || response.data;
    } catch (error: unknown) {
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
  static async copyFileToAccessibleLocation(sourceUri: string, mimeType: string = 'image/jpeg'): Promise<string> {
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
        // We need to ensure it has file:// prefix for fetch to access it
        let cacheDir = FileSystem.cacheDirectory;
        if (!cacheDir) {
          throw new Error('FileSystem.cacheDirectory is null');
        }
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
        
        // CRITICAL: Ensure we return URI with file:// prefix for fetch
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
  static async uploadAvatar(formData: ReactNativeFormData): Promise<any> {
    try {
      
      // Use FormData with fetch for file uploads (standard React Native approach)
      // The api instance automatically adds Authorization header via interceptor
      
      // Web endpoint: /api/v1/profile/avatar
      // Mobile API_BASE_URL already contains /api/v1 (e.g., https://backend.com/api/v1)
      // So we use: /profile/avatar to get final URL: https://backend.com/api/v1/profile/avatar
      // This matches web: baseURL (http://localhost:5001) + /api/v1/profile/avatar
      const endpoint = '/profile/avatar';
      
      
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
            
            // CRITICAL: On React Native, fetch needs the URI with file:// prefix
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
      
      // Verify fetch configuration
      // Use fetch (via api instance) - the interceptor will handle Content-Type correctly
      // Use the same endpoint path as web app: /profile/avatar
      // Final URL should be: {API_BASE_URL}/profile/avatar = {API_BASE_URL}/api/v1/profile/avatar (since API_BASE_URL contains /api/v1)
      
      // Use fetch with FormData for upload (same pattern as communityApi)
      // The interceptor in api.ts already handles FormData correctly by removing Content-Type
      // This is the same pattern used successfully in communityApi.ts
      
      // Extract file info from FormData to verify it's valid
      if (formData._parts && formData._parts.length > 0) {
        const fileObj = formData._parts[0][1];
        if (!fileObj || !fileObj.uri) {
          throw new Error('FormData file object is missing URI');
        }
      } else {
        throw new Error('FormData does not contain file information');
      }
      
      try {
        // Use fetch with FormData for PATCH upload (via api instance)
        // The api instance interceptor automatically:
        // - Adds Authorization header with Firebase ID token
        // - Removes Content-Type header for FormData (fetch/browser sets it with boundary)
        // CRITICAL: Keep file:// prefix in FormData - fetch needs it to access the file on React Native
        const response = await api.patch(endpoint, formData);
        
        // Backend returns: { status: "success", data: { avatarUrl: "...", ... } }
        const responseData = response.data?.data || response.data;
          return responseData;
      } catch (uploadError: unknown) {
        const err = uploadError as any;
        
        // Handle timeout errors
        if (err?.message?.includes('timeout') || err?.message?.includes('TIMEOUT')) {
          const timeoutError = new Error('Le téléchargement prend trop de temps. Vérifiez votre connexion internet ou essayez avec une image plus petite.') as any;
          timeoutError.code = 'ECONNABORTED';
          throw timeoutError;
        }
        
        // Handle network errors
        if (err?.message?.includes('Network') || err?.message?.includes('network')) {
          const networkError = new Error('Erreur de connexion ou fichier inaccessible. Vérifiez votre connexion internet et réessayez.') as any;
          networkError.code = 'ERR_NETWORK';
          throw networkError;
        }
        
        // Re-throw other errors
        throw uploadError;
      }
    } catch (error: unknown) {
      // This catch block is for errors before the XHR request
      // Provide more detailed error information
      const err = error as any;
      
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        throw new Error('Le téléchargement prend trop de temps. Vérifiez votre connexion internet ou essayez avec une image plus petite.');
      }
      
      if (err?.message?.includes('Network Error') || err?.message?.includes('Network request failed') || (!err?.response && !err?.request)) {
        throw new Error('Erreur de connexion ou fichier inaccessible. Vérifiez votre connexion internet et réessayez.');
      }
      
      // Handle server errors
      if (err?.response) {
        const status = err.response.status;
        const errorData = err.response.data;
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
      throw err?.message ? err : new Error('Erreur lors du téléchargement de l\'avatar');
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
  static async createMeasurement(measurementData: any): Promise<any> {
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
  static async deleteMeasurement(measurementId: string): Promise<any> {
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
  static async updateProgress(progressData: any): Promise<any> {
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
  static parseAddress(addressString: string): { address1: string; address2: string; city: string; postalCode: string; country: string } {
    if (!addressString) return { address1: '', address2: '', city: '', postalCode: '', country: '' };
    
    const parts = addressString.split(';').map((part: string) => part.trim());
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
  static formatAddress(address: { address1?: string; address2?: string; city?: string; postalCode?: string; country?: string }): string {
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
  static async createRendezvous(rendezvousData: any): Promise<any> {
    try {
      
      const response = await api.post('/onboarding/rendezvous', rendezvousData);
      
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user account (mobile-friendly endpoint)
   * @param {Object} feedback - Optional feedback with reason and comments
   * @param {string} feedback.reason - Reason for account deletion
   * @param {string} feedback.comments - Additional comments/feedback
   * @returns {Promise<Object>} Delete response
   */
  static async deleteAccount(feedback?: { reason?: string; comments?: string }) {
    try {
      // Utiliser l'endpoint mobile-friendly selon le commit: POST /api/v1/user/account-deletion
      // Si cet endpoint n'existe pas encore, fallback sur DELETE /api/v1/profile
      const API_CONFIG = require('../config/apiConfig').API_CONFIG;
      const endpoint = API_CONFIG.endpoints.profile.deleteMobile || '/user/account-deletion'; // Endpoint mobile-friendly (pas de mot de passe requis)
      
      const payload = {
        reason: feedback?.reason || undefined,
        feedback: feedback?.comments || undefined, // Le backend peut utiliser 'feedback' ou 'comments'
      };
      
      console.log('🗑️ [ProfileApi.deleteAccount] Starting account deletion...');
      console.log('📡 [ProfileApi.deleteAccount] Endpoint:', endpoint);
      console.log('📡 [ProfileApi.deleteAccount] Method: POST');
      console.log('📦 [ProfileApi.deleteAccount] Payload:', JSON.stringify(payload, null, 2));
      
      // Use api instance - interceptor automatically adds Authorization header
      const response = await api.post(endpoint, payload);

      console.log('📥 [ProfileApi.deleteAccount] Response status:', response.status);
      if (response.data) {
        console.log('📥 [ProfileApi.deleteAccount] Response data:', JSON.stringify(response.data, null, 2));
      }

      console.log('✅ [ProfileApi.deleteAccount] Account deletion successful');
      
      // Retourner la réponse complète pour vérification
      return response.data || { success: true };
    } catch (error: any) {
      console.error('❌ [ProfileApi.deleteAccount] Account deletion failed');
      console.error('❌ [ProfileApi.deleteAccount] Error:', error);
      if (error.response?.status) {
        console.error('❌ [ProfileApi.deleteAccount] Response status:', error.response.status);
        console.error('❌ [ProfileApi.deleteAccount] Response data:', JSON.stringify(error.response.data, null, 2));
      }
      throw error;
    }
  }
}

export default ProfileApi;
