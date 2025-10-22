import api from './api';
import Config from '../config/env';

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
      console.log('👤 Updating user profile...');
      console.log('👤 Update data:', profileData);
      
      const response = await api.put('/profile', profileData);
      
      console.log('✅ Profile updated successfully');
      console.log('👤 Update response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      throw error;
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
      
      const response = await api.patch('/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('✅ Avatar uploaded successfully');
      console.log('👤 Avatar response:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      throw error;
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
