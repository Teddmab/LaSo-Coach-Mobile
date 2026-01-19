import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAuthService } from './firebaseAuthServiceNew';
import api from './api';

/**
 * UGC Terms Service - Manages user acceptance of UGC zero-tolerance policy
 * 
 * API Contract:
 * - Accept: PATCH /api/v1/profile/accept-ugc-terms (no body)
 * - Check Status: GET /api/v1/profile/ugc-terms-status
 * 
 * Handles:
 * - Local persistence of UGC acceptance status
 * - Backend sync of acceptance timestamp
 * - Checking if user has accepted terms
 */

// Base keys - will be appended with userId for user-specific storage
const UGC_ACCEPTANCE_KEY_PREFIX = '@laso_ugc_terms_accepted';
const UGC_ACCEPTANCE_TIMESTAMP_KEY_PREFIX = '@laso_ugc_terms_timestamp';

/**
 * Get user-specific storage keys
 */
const getUgcKeys = (userId: string | null | undefined): { acceptanceKey: string; timestampKey: string } => {
  if (!userId) {
    // Fallback to global keys if no userId (should not happen in production)
    console.warn('⚠️ [UgcTermsService] No userId provided, using fallback keys');
    return {
      acceptanceKey: `${UGC_ACCEPTANCE_KEY_PREFIX}_fallback`,
      timestampKey: `${UGC_ACCEPTANCE_TIMESTAMP_KEY_PREFIX}_fallback`,
    };
  }
  return {
    acceptanceKey: `${UGC_ACCEPTANCE_KEY_PREFIX}_${userId}`,
    timestampKey: `${UGC_ACCEPTANCE_TIMESTAMP_KEY_PREFIX}_${userId}`,
  };
};

export interface UgcTermsStatus {
  accepted: boolean;
  timestamp?: number;
  synced: boolean;
}

/**
 * Check if user has accepted UGC terms locally
 */
export const hasAcceptedUgcTermsLocally = async (userId: string | null | undefined): Promise<boolean> => {
  try {
    const { acceptanceKey } = getUgcKeys(userId);
    const accepted = await AsyncStorage.getItem(acceptanceKey);
    return accepted === 'true';
  } catch (error) {
    console.error('❌ [UgcTermsService] Error reading local UGC acceptance:', error);
    return false;
  }
};

/**
 * Get UGC acceptance status (local + timestamp)
 */
export const getUgcAcceptanceStatus = async (userId: string | null | undefined): Promise<UgcTermsStatus> => {
  try {
    const { acceptanceKey, timestampKey } = getUgcKeys(userId);
    const accepted = await AsyncStorage.getItem(acceptanceKey);
    const timestamp = await AsyncStorage.getItem(timestampKey);

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
 * Uses PATCH /profile/accept-ugc-terms (no body required)
 * Note: API_BASE_URL already contains /api/v1, so we use /profile/accept-ugc-terms
 */
export const acceptUgcTerms = async (userId: string | null | undefined): Promise<boolean> => {
  try {
    console.log('🔄 [UgcTermsService] Sending UGC terms acceptance to backend (PATCH /profile/accept-ugc-terms)...');
    // Sync with backend first (source of truth)
    try {
      const response = await api.patch('/profile/accept-ugc-terms');
      
      console.log('📥 [UgcTermsService] Backend response:', {
        status: response.status,
        statusText: response.statusText,
        data: JSON.stringify(response.data, null, 2),
      });
      
      // Backend returns: { message: "...", user: { hasAcceptedUGCTerms: true, ugcTermsAcceptedAt: "..." } }
      // Or might return directly: { hasAcceptedUGCTerms: true, ugcTermsAcceptedAt: "..." }
      const user = response.data?.user || response.data;
      const hasAccepted = user?.hasAcceptedUGCTerms !== undefined 
        ? user.hasAcceptedUGCTerms 
        : (response.status === 200 || response.status === 204); // If 200/204, consider accepted
      const acceptedAt = user?.ugcTermsAcceptedAt || new Date().toISOString();
      const timestamp = new Date(acceptedAt).getTime();

      // If status is 200/204, consider it successful even if hasAcceptedUGCTerms is not in response
      if (hasAccepted || response.status === 200 || response.status === 204) {
        // Save locally with backend timestamp (user-specific)
        const { acceptanceKey, timestampKey } = getUgcKeys(userId);
        await AsyncStorage.setItem(acceptanceKey, 'true');
        await AsyncStorage.setItem(timestampKey, timestamp.toString());

        console.log('✅ [UgcTermsService] UGC terms acceptance synced with backend (user-specific):', {
          userId,
          status: response.status,
          hasAcceptedUGCTerms: user?.hasAcceptedUGCTerms,
          ugcTermsAcceptedAt: acceptedAt,
          timestamp: timestamp,
        });
      return true;
      } else {
        console.warn('⚠️ [UgcTermsService] Backend did not confirm acceptance:', {
          status: response.status,
          hasAcceptedUGCTerms: user?.hasAcceptedUGCTerms,
          responseData: response.data,
        });
        return false;
      }
    } catch (backendError: any) {
      console.error('❌ [UgcTermsService] Backend sync failed:', {
        status: backendError?.response?.status,
        message: backendError?.response?.data?.message || backendError?.message,
        data: backendError?.response?.data,
      });
      
      // If backend fails, save locally anyway (offline support) - user-specific
      const now = Date.now();
      const { acceptanceKey, timestampKey } = getUgcKeys(userId);
      await AsyncStorage.setItem(acceptanceKey, 'true');
      await AsyncStorage.setItem(timestampKey, now.toString());
      
      console.warn('⚠️ [UgcTermsService] Backend sync failed, but local acceptance saved (user-specific)');
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
export const clearUgcTermsAcceptance = async (userId: string | null | undefined): Promise<void> => {
  try {
    const { acceptanceKey, timestampKey } = getUgcKeys(userId);
    await AsyncStorage.removeItem(acceptanceKey);
    await AsyncStorage.removeItem(timestampKey);
    console.log('✅ [UgcTermsService] UGC terms acceptance cleared (user-specific):', { userId });
  } catch (error) {
    console.error('❌ [UgcTermsService] Error clearing UGC acceptance:', error);
    throw error;
  }
};

/**
 * Force re-acceptance of UGC terms
 * Clears local acceptance and forces user to accept again
 */
export const forceReAcceptance = async (userId: string | null | undefined): Promise<void> => {
  try {
    await clearUgcTermsAcceptance(userId);
    console.log('🔄 [UgcTermsService] UGC terms acceptance cleared - user must re-accept:', { userId });
  } catch (error) {
    console.error('❌ [UgcTermsService] Error forcing re-acceptance:', error);
    throw error;
  }
};

/**
 * Get UGC acceptance status from backend (source of truth)
 * Uses GET /profile/ugc-terms-status
 * Note: API_BASE_URL already contains /api/v1, so we use /profile/ugc-terms-status
 * Response: { hasAccepted: boolean, acceptedAt: string }
 */
export const getUgcAcceptanceFromBackend = async (userId: string | null | undefined): Promise<UgcTermsStatus> => {
  try {
    const response = await api.get('/profile/ugc-terms-status');
    
    console.log('📥 [UgcTermsService] Backend status response:', {
      status: response.status,
      data: JSON.stringify(response.data, null, 2),
    });
    
    // Backend returns: { hasAccepted: true, acceptedAt: "2026-01-18T12:34:56.789Z" }
    // Or might be nested: { data: { hasAccepted: true, acceptedAt: "..." } }
    const data = response.data?.data || response.data;
    const hasAccepted = data?.hasAccepted !== undefined ? data.hasAccepted : (response.status === 200);
    
    if (hasAccepted) {
      const acceptedAt = data?.acceptedAt;
      const timestamp = acceptedAt ? new Date(acceptedAt).getTime() : Date.now();
      
      // Update local storage to match backend (user-level acceptance, user-specific keys)
      const { acceptanceKey, timestampKey } = getUgcKeys(userId);
      await AsyncStorage.setItem(acceptanceKey, 'true');
      await AsyncStorage.setItem(timestampKey, timestamp.toString());
      
      console.log('✅ [UgcTermsService] UGC acceptance confirmed from backend (user-level, user-specific storage):', {
        userId,
        hasAccepted: hasAccepted,
        acceptedAt: acceptedAt,
        timestamp: timestamp,
      });
      return {
        accepted: true,
        timestamp: timestamp,
        synced: true,
      };
    }
    
    // Backend says not accepted
    console.log('❌ [UgcTermsService] Backend says UGC terms not accepted:', { userId });
    return { accepted: false, synced: true };
  } catch (backendError: any) {
    console.error('❌ [UgcTermsService] Backend check error:', {
      status: backendError?.response?.status,
      message: backendError?.response?.data?.message || backendError?.message,
      data: backendError?.response?.data,
    });
    
    // If 404, endpoint might not exist or user hasn't accepted on backend
    // In this case, check local status as fallback
    if (backendError?.response?.status === 404) {
      console.log('ℹ️ [UgcTermsService] Backend endpoint returned 404, checking local status...');
      const localStatus = await getUgcAcceptanceStatus(userId);
      // If user has accepted locally, use that as source of truth
      if (localStatus.accepted) {
        console.log('✅ [UgcTermsService] User has accepted locally, using local status as source of truth:', { userId });
        return { ...localStatus, synced: false };
      }
      return { accepted: false, synced: true };
    }
    
    console.warn('⚠️ [UgcTermsService] Backend check failed, falling back to local status:', { userId });
    // On error, fall back to local status
    const localStatus = await getUgcAcceptanceStatus(userId);
    return { ...localStatus, synced: false };
  }
};

/**
 * Sync UGC acceptance status with backend
 * Used on app startup to check if user needs to re-accept terms
 * IMPORTANT: Backend is the source of truth - user-level acceptance, not device-level
 * Always checks backend first to ensure synchronization
 */
export const syncUgcAcceptanceWithBackend = async (userId: string | null | undefined): Promise<UgcTermsStatus> => {
  try {
    // Always check backend first (source of truth)
    console.log('🔄 [UgcTermsService] Checking backend for UGC acceptance status (user-specific):', { userId });
    const backendStatus = await getUgcAcceptanceFromBackend(userId);
    
    // If backend says accepted, we're done (local storage already updated by getUgcAcceptanceFromBackend)
    if (backendStatus.accepted && backendStatus.synced) {
      console.log('✅ [UgcTermsService] Backend confirms UGC terms accepted:', { userId });
      return backendStatus;
    }
    
    // Backend says not accepted - check local status
    const localStatus = await getUgcAcceptanceStatus(userId);

    // If locally accepted but not on backend, try to sync
    if (localStatus.accepted && !backendStatus.accepted) {
      console.log('🔄 [UgcTermsService] Local acceptance found but backend says not accepted - syncing...', { userId });
      try {
        await api.patch('/profile/accept-ugc-terms');
        console.log('✅ [UgcTermsService] Local acceptance synced to backend:', { userId });
        
        // Re-check backend to get the updated status
        const updatedBackendStatus = await getUgcAcceptanceFromBackend(userId);
        return updatedBackendStatus;
      } catch (syncError) {
        console.warn('⚠️ [UgcTermsService] Failed to sync local acceptance to backend:', { userId, error: syncError });
        // Return not accepted since backend is source of truth
        return { accepted: false, synced: true };
      }
    }
    
    // Neither backend nor local has acceptance
    console.log('❌ [UgcTermsService] UGC terms not accepted on backend or locally:', { userId });
    return { accepted: false, synced: true };
  } catch (error) {
    console.error('❌ [UgcTermsService] Error syncing UGC acceptance:', { userId, error });
    // On error, check local status as fallback
    const localStatus = await getUgcAcceptanceStatus(userId);
    return { ...localStatus, synced: false };
  }
};

/**
 * Reset UGC terms requirement (for testing)
 * Note: This endpoint may not exist in the new API contract
 * If needed, backend should provide a reset endpoint
 */
export const resetUgcTermsRequirement = async (userId: string | null | undefined): Promise<boolean> => {
  try {
    // Clear local storage (user-specific)
    await clearUgcTermsAcceptance(userId);
    console.log('✅ [UgcTermsService] UGC terms requirement cleared locally (user-specific):', { userId });
    // Note: Backend reset would require a specific endpoint (not in current API contract)
    return true;
  } catch (error) {
    console.error('❌ [UgcTermsService] Error resetting UGC terms:', { userId, error });
    return false;
  }
};
