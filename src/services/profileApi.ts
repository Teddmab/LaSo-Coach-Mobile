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
      console.log('👤 Fetching user profile...');
      const response = await api.get('/profile');
      
      console.log('✅ Profile fetched successfully');
      console.log('👤 Profile data:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
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
      console.log('👤 Updating user profile (fetch, no axios)...');
      console.log('👤 Update data:', profileData);

      // Récupérer le token Firebase pour l'authentification
      const firebaseAuthService = require('./firebaseAuthServiceNew').default;
      const idToken = await firebaseAuthService.getIdToken();

      if (!idToken) {
        throw new Error('Token d\'authentification manquant. Veuillez vous reconnecter.');
      }

      const url = `${Config.API_BASE_URL}/profile`;
      console.log('🌐 Calling URL (PUT - like web version):', url);

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
        console.warn('⚠️ Profile update: response is not valid JSON, raw text:', text);
      }

      if (!response.ok) {
        console.error('❌ Error updating profile (fetch):', {
          status: response.status,
          statusText: response.statusText,
          body: json || text,
        });
        const message = json?.message || `Erreur lors de la mise à jour du profil (code ${response.status})`;
        const error: any = new Error(message);
        error.status = response.status;
        error.data = json;
        throw error;
      }

      console.log('✅ Profile updated successfully (fetch)');
      console.log('👤 Update response:', json);
      console.log('👤 Update response data:', json?.data);
      console.log('👤 Update response profile:', json?.data?.profile);

      // Retourner la réponse complète pour vérification
      return json;
    } catch (error) {
      console.error('❌ Error updating profile (fetch):', error);
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
      // On iOS or if already a file:// URI, return as-is
      if (Platform.OS === 'ios' || sourceUri.startsWith('file://')) {
        console.log('📁 URI already accessible:', sourceUri.substring(0, 50));
        return sourceUri;
      }

      // On Android with content:// URI, copy to cache directory
      if (sourceUri.startsWith('content://')) {
        console.log('📁 Copying content:// URI to accessible location...');
        
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
        
        console.log('📁 Copying from:', sourceUri.substring(0, 50));
        console.log('📁 Copying to:', destUri);
        
        // Copy the file using expo-file-system
        await FileSystem.copyAsync({
          from: sourceUri,
          to: destUri,
        });
        
        // Verify file exists after copy
        const fileInfo = await FileSystem.getInfoAsync(destUri);
        if (!fileInfo.exists) {
          console.error('❌ File does not exist after copy:', destUri);
          throw new Error('Failed to copy file to accessible location');
        }
        
        console.log('✅ File copied successfully to:', destUri);
        console.log('📁 File info:', {
          exists: fileInfo.exists,
          size: fileInfo.size,
          uri: destUri.substring(0, 50) + '...'
        });
        // CRITICAL: Ensure we return URI with file:// prefix for axios
        return destUri.startsWith('file://') ? destUri : `file://${destUri}`;
      }

      // Unknown URI format, return as-is
      console.log('📁 URI format:', sourceUri.substring(0, 50));
      return sourceUri;
    } catch (error) {
      console.error('❌ Error copying file:', error);
      console.error('❌ Error details:', error.message, error.stack);
      // If copy fails, return original URI as fallback
      console.warn('⚠️ Returning original URI - upload may fail');
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
      console.log('👤 Uploading avatar...');
      
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
      
      console.log('📤 ===== AVATAR UPLOAD DEBUG =====');
      console.log('📤 API_BASE_URL:', Config.API_BASE_URL);
      console.log('📤 Endpoint:', endpoint);
      console.log('📤 Expected Full URL:', expectedFullUrl);
      console.log('📤 Has token:', !!idToken);
      console.log('📤 Token length:', idToken ? idToken.length : 0);
      console.log('📤 FormData type:', formData.constructor.name);
      
      // Log FormData contents (if possible) and verify file accessibility
      if (formData && typeof formData._parts !== 'undefined') {
        console.log('📤 FormData parts count:', formData._parts ? formData._parts.length : 0);
        if (formData._parts && formData._parts.length > 0) {
          const firstPart = formData._parts[0];
          const fileObj = firstPart[1];
          
          console.log('📤 FormData first part:', {
            key: firstPart[0],
            valueType: typeof fileObj,
            isObject: typeof fileObj === 'object',
            hasUri: fileObj?.uri ? 'yes' : 'no',
            uriPreview: fileObj?.uri ? fileObj.uri.substring(0, 50) + '...' : 'N/A',
            type: fileObj?.type,
            name: fileObj?.name
          });
          
          // Verify file URI (non-blocking - log only)
          if (fileObj?.uri) {
            try {
              // Check if file exists (only for file:// URIs)
              if (fileObj.uri.startsWith('file://')) {
                const fileInfo = await FileSystem.getInfoAsync(fileObj.uri);
                if (fileInfo.exists) {
                  console.log('✅ File verified and exists:', {
                    uri: fileObj.uri.substring(0, 50) + '...',
                    size: fileInfo.size,
                    exists: fileInfo.exists
                  });
                } else {
                  console.warn('⚠️ File does not exist at URI:', fileObj.uri.substring(0, 50) + '...');
                }
              } else {
                console.log('⚠️ File URI is not file:// (content:// - cannot verify):', fileObj.uri.substring(0, 50) + '...');
              }
            } catch (fileError) {
              // Non-blocking: just log the error but continue
              console.warn('⚠️ Could not verify file (continuing anyway):', fileError.message);
            }
          }
        }
      }
      console.log('📤 ===== END DEBUG =====');
      
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
            console.log('✅ File verified before upload:', {
              exists: fileInfo.exists,
              size: fileInfo.size,
              uri: fileObj.uri.substring(0, 50) + '...'
            });
            
            // CRITICAL: On React Native, axios may need the URI without file:// prefix
            // But we also need to ensure the file is accessible
            // Try to read a small portion to verify accessibility
            try {
              const fileContent = await FileSystem.readAsStringAsync(fileObj.uri, {
                encoding: FileSystem.EncodingType.Base64,
                length: 100 // Just read first 100 bytes to verify
              });
              console.log('✅ File is readable (first 100 bytes read successfully)');
            } catch (readError) {
              console.warn('⚠️ Could not read file for verification, but continuing anyway:', readError.message);
            }
          } catch (fileError) {
            console.error('❌ File verification failed:', fileError);
            throw new Error('Le fichier sélectionné n\'est pas accessible. Veuillez réessayer.');
          }
        }
      }
      
      // Verify axios configuration
      console.log('📤 Axios configuration:', {
        baseURL: api.defaults.baseURL,
        timeout: api.defaults.timeout,
        hasFormData: formData instanceof FormData
      });
      
      // Use axios - the interceptor will handle Content-Type correctly
      // Use the same endpoint path as web app: /profile/avatar
      // Final URL should be: {API_BASE_URL}/profile/avatar = {API_BASE_URL}/api/v1/profile/avatar (since API_BASE_URL contains /api/v1)
      console.log('📤 Sending PATCH request to:', endpoint);
      console.log('📤 Expected full URL:', expectedFullUrl);
      console.log('📤 Axios baseURL:', api.defaults.baseURL);
      console.log('📤 Final URL will be:', `${api.defaults.baseURL}${endpoint}`);
      
      // CRITICAL FIX: Use axios like other working uploads (communityApi, progressPhotosApi)
      // The interceptor in api.js already handles FormData correctly by removing Content-Type
      // This is the same pattern used successfully in communityApi.js and progressPhotosApi.js
      console.log('📤 Using axios for FormData upload (same as working uploads)');
      console.log('📤 Endpoint:', endpoint);
      console.log('📤 Full URL:', `${api.defaults.baseURL}${endpoint}`);
      
      // Log FormData structure one more time before sending
      if (formData._parts) {
        console.log('📤 FormData parts before send:', formData._parts.map(part => ({
          key: part[0],
          hasUri: !!part[1]?.uri,
          uriPreview: part[1]?.uri ? part[1].uri.substring(0, 50) + '...' : 'N/A',
          type: part[1]?.type,
          name: part[1]?.name
        })));
      }
      
      // CRITICAL FIX: Use react-native-blob-util for PATCH FormData uploads
      // This library is specifically designed for file uploads on React Native
      // and handles multipart/form-data much better than axios or XMLHttpRequest
      const fullUrl = `${Config.API_BASE_URL}${endpoint}`;
      console.log('📤 Using react-native-blob-util for PATCH FormData upload');
      console.log('📤 Full URL:', fullUrl);
      
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
        
        console.log('📤 File info:', {
          uri: fileUri.substring(0, 50) + '...',
          name: fileName,
          originalType: rawType,
          normalizedType: fileType
        });
      } else {
        throw new Error('FormData does not contain file information');
      }
      
      // react-native-blob-util can handle file:// URIs directly
      // But on Android, we might need to remove the prefix
      let filePath = fileUri;
      if (Platform.OS === 'android' && filePath.startsWith('file://')) {
        filePath = filePath.replace('file://', '');
      }
      
      try {
        // Use react-native-blob-util for upload
        // This library handles multipart/form-data correctly for all HTTP methods including PATCH
        // CRITICAL: Ensure MIME type is correctly set - multer checks file.mimetype
        // Syntax: ReactNativeBlobUtil.fetch(method, url, headers, formData)
        console.log('📤 Sending with react-native-blob-util:', {
          method: 'PATCH',
          url: fullUrl,
          fileName: fileName,
          fileType: fileType,
          filePath: filePath.substring(0, 50) + '...'
        });
        
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
        
        console.log('📥 Upload response status:', response.info().status);
        
        const responseData = response.json();
        
        if (response.info().status >= 200 && response.info().status < 300) {
          console.log('✅ Avatar uploaded successfully');
          console.log('👤 Avatar response:', JSON.stringify(responseData, null, 2));
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
        console.error('❌ react-native-blob-util upload failed:', uploadError);
        
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
      console.error('❌ Error before XHR request:', error);
      console.error('❌ Error uploading avatar:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null,
        request: error.request ? 'Request made but no response' : null
      });
      
      // Provide more detailed error information
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.error('❌ Upload timeout - image may be too large or connection too slow');
        throw new Error('Le téléchargement prend trop de temps. Vérifiez votre connexion internet ou essayez avec une image plus petite.');
      }
      
      if (error.message?.includes('Network Error') || error.message?.includes('Network request failed') || (!error.response && !error.request)) {
        console.error('❌ Network error during upload - this might be a file access issue');
        console.error('❌ Possible causes:');
        console.error('   1. File URI not accessible (content:// URIs need special handling)');
        console.error('   2. Network connectivity issue');
        console.error('   3. Server unreachable');
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
      console.log('📏 Fetching measurements...');
      const response = await api.get('/onboarding/measurements');
      
      console.log('✅ Measurements fetched successfully');
      console.log('📏 Measurements data:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching measurements:', error);
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
      console.log('📏 Creating new measurement...');
      console.log('📏 Measurement data:', measurementData);
      
      const response = await api.post('/onboarding/measurements', measurementData);
      
      console.log('✅ Measurement created successfully');
      console.log('📏 Create response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating measurement:', error);
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
      console.log('📏 Deleting measurement:', measurementId);
      
      const response = await api.delete(`/onboarding/measurements/${measurementId}`);
      
      console.log('✅ Measurement deleted successfully');
      console.log('📏 Delete response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error deleting measurement:', error);
      throw error;
    }
  }

  /**
   * Get onboarding progress
   * @returns {Promise<Object>} Progress data
   */
  static async getProgress() {
    try {
      console.log('📊 Fetching onboarding progress...');
      const response = await api.get('/onboarding/progress');
      
      console.log('✅ Progress fetched successfully');
      console.log('📊 Progress data:', response.data);
      
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
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
      console.log('📊 Updating onboarding progress...');
      console.log('📊 Progress data:', progressData);
      
      const response = await api.patch('/onboarding/progress', progressData);
      
      console.log('✅ Progress updated successfully');
      console.log('📊 Update response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating progress:', error);
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
      console.log('👤 Fetching occupation options...');
      const response = await api.get('/profile/occupation-options');
      
      console.log('✅ Occupation options fetched successfully');
      console.log('👤 Occupation options:', response.data);
      
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('❌ Error fetching occupation options:', error);
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
      console.log('📅 Fetching current rendezvous...');
      const response = await api.get('/onboarding/rendezvous/current');
      
      console.log('✅ Current rendezvous fetched successfully');
      console.log('📅 Rendezvous data:', response.data);
      
      return response.data.data || null;
    } catch (error) {
      console.error('❌ Error fetching current rendezvous:', error);
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
      console.log('📅 Creating rendezvous...');
      console.log('📅 Rendezvous data:', rendezvousData);
      
      const response = await api.post('/onboarding/rendezvous', rendezvousData);
      
      console.log('✅ Rendezvous created successfully');
      console.log('📅 Create response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error creating rendezvous:', error);
      throw error;
    }
  }
}

export default ProfileApi;
