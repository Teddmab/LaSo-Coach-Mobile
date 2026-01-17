import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { firebaseAuthService } from './firebaseAuthServiceNew';
import api from './api';

/**
 * UGC Terms Service - Manages user acceptance of UGC zero-tolerance policy
 * 
 * Phase 7 - TODO #3: Verify backend endpoint `/ugc-terms` exists
 * Phase 7 - TODO #4: Add retry logic for failed backend syncs
 * 
 * Handles:
 * - Local persistence of UGC acceptance status
 * - Backend sync of acceptance timestamp
 * - Checking if user has accepted terms
 */

const UGC_ACCEPTANCE_KEY = '@laso_ugc_terms_accepted';
const UGC_ACCEPTANCE_TIMESTAMP_KEY = '@laso_ugc_terms_timestamp';

export interface UgcTermsStatus {
  accepted: boolean;
  timestamp?: number;
  synced: boolean;
}

/**
 * Check if user has accepted UGC terms locally
 */
export const hasAcceptedUgcTermsLocally = async (): Promise<boolean> => {
  try {
    const accepted = await AsyncStorage.getItem(UGC_ACCEPTANCE_KEY);
    return accepted === 'true';
  } catch (error) {
    console.error('❌ [UgcTermsService] Error reading local UGC acceptance:', error);
    return false;
  }
};

/**
 * Get UGC acceptance status (local + timestamp)
 */
export const getUgcAcceptanceStatus = async (): Promise<UgcTermsStatus> => {
  try {
    const accepted = await AsyncStorage.getItem(UGC_ACCEPTANCE_KEY);
    const timestamp = await AsyncStorage.getItem(UGC_ACCEPTANCE_TIMESTAMP_KEY);

    return {
      accepted: accepted === 'true',
      timestamp: timestamp ? parseInt(timestamp, 10) : undefined,
      synced: false, // Will be updated after backend check
    };
  } catch (error) {
    console.error('❌ [UgcTermsService] Error reading UGC acceptance status:', error);
    return { accepted: false, synced: false };
  }
};

/**
 * Accept UGC terms - save locally and sync with backend
 */
export const acceptUgcTerms = async (): Promise<boolean> => {
  try {
    const now = Date.now();

    // Save locally first
    await AsyncStorage.setItem(UGC_ACCEPTANCE_KEY, 'true');
    await AsyncStorage.setItem(UGC_ACCEPTANCE_TIMESTAMP_KEY, now.toString());

    console.log('✅ [UgcTermsService] UGC terms acceptance saved locally');

    // Sync with backend
    try {
      const response = await api.post('/ugc-terms', {
        accepted: true,
        timestamp: now,
      });

      console.log('✅ [UgcTermsService] UGC terms acceptance synced with backend');
      return true;
    } catch (backendError) {
      console.warn('⚠️ [UgcTermsService] Backend sync failed, but local acceptance saved:', backendError);
      // We don't fail here - local acceptance is sufficient
      // Backend will sync on next successful request
      return true;
    }
  } catch (error) {
    console.error('❌ [UgcTermsService] Error accepting UGC terms:', error);
    throw error;
  }
};

/**
 * Clear UGC terms acceptance (for testing/logout)
 */
export const clearUgcTermsAcceptance = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(UGC_ACCEPTANCE_KEY);
    await AsyncStorage.removeItem(UGC_ACCEPTANCE_TIMESTAMP_KEY);
    console.log('✅ [UgcTermsService] UGC terms acceptance cleared');
  } catch (error) {
    console.error('❌ [UgcTermsService] Error clearing UGC acceptance:', error);
    throw error;
  }
};

/**
 * Sync UGC acceptance status with backend
 * Used on app startup to check if user needs to re-accept terms
 */
export const syncUgcAcceptanceWithBackend = async (): Promise<UgcTermsStatus> => {
  try {
    const localStatus = await getUgcAcceptanceStatus();

    // If no local acceptance, return immediately
    if (!localStatus.accepted) {
      return { ...localStatus, synced: true };
    }

    // Try to sync with backend
    try {
      const response = await api.get('/ugc-terms');
      
      // Backend confirmed acceptance
      if (response.data?.accepted) {
        console.log('✅ [UgcTermsService] UGC acceptance confirmed with backend');
        return {
          accepted: true,
          timestamp: localStatus.timestamp,
          synced: true,
        };
      }

      // Backend doesn't have acceptance - re-sync
      console.warn('⚠️ [UgcTermsService] Backend doesn\'t have UGC acceptance, re-syncing...');
      if (localStatus.timestamp) {
        await api.post('/ugc-terms', {
          accepted: true,
          timestamp: localStatus.timestamp,
        });
      }
      return { ...localStatus, synced: true };
    } catch (backendError) {
      console.warn('⚠️ [UgcTermsService] Backend sync check failed:', backendError);
      // If backend error, trust local status
      return { ...localStatus, synced: false };
    }
  } catch (error) {
    console.error('❌ [UgcTermsService] Error syncing UGC acceptance:', error);
    return { accepted: false, synced: false };
  }
};

/**
 * Reset UGC terms requirement (for testing)
 * Requires backend to confirm reset
 */
export const resetUgcTermsRequirement = async (): Promise<boolean> => {
  try {
    await api.post('/ugc-terms/reset', {});
    await clearUgcTermsAcceptance();
    console.log('✅ [UgcTermsService] UGC terms requirement reset');
    return true;
  } catch (error) {
    console.error('❌ [UgcTermsService] Error resetting UGC terms:', error);
    return false;
  }
};
