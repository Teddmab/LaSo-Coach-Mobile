import { useState, useEffect, useCallback } from 'react';
import * as ugcTermsService from '../services/ugcTermsService';
import { useAuth } from '../context/FirebaseAuthContext';

/**
 * useUgcTerms - React hook for managing UGC terms acceptance
 * 
 * Phase 7 - TODO #5: Handle permission changes during app lifecycle
 * Phase 7 - TODO #6: Add analytics tracking for term acceptance
 * 
 * Provides:
 * - UGC terms acceptance status
 * - Modal visibility control
 * - Accept/decline handlers
 * - Sync with backend
 * 
 * IMPORTANT: UGC acceptance is per-user, not per-device
 * Each user must accept terms independently, even on the same device
 */

export interface UseUgcTermsReturn {
  termsAccepted: boolean;
  termsLoading: boolean;
  showTermsModal: boolean;
  setShowTermsModal: (show: boolean) => void;
  handleAcceptTerms: () => Promise<void>;
  handleDeclineTerms: () => void;
  checkTermsStatus: () => Promise<void>;
}

export const useUgcTerms = (): UseUgcTermsReturn => {
  const { user } = useAuth();
  const userId = user?.id || user?.uid || null;
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Check if user has accepted terms on mount and when user changes
  // IMPORTANT: Backend is the source of truth (user-level acceptance, not device-level)
  // Always checks backend first to ensure proper synchronization
  // CRITICAL: Reset and re-check when user changes to ensure each user sees UGC modal
  useEffect(() => {
    // Reset state when user changes
    if (!userId) {
      setTermsAccepted(false);
      setTermsLoading(false);
      setShowTermsModal(false);
      return;
    }

    const checkTerms = async () => {
      try {
        console.log('🔍 [useUgcTerms] Checking UGC terms status from backend (user-level, user-specific):', { userId });
        setTermsLoading(true);
        setTermsAccepted(false);
        setShowTermsModal(false);

        // Always check backend first (source of truth)
        // This will also update local storage if backend has acceptance
        const backendStatus = await ugcTermsService.syncUgcAcceptanceWithBackend(userId);
        
        console.log('📊 [useUgcTerms] Backend status:', {
          userId,
          accepted: backendStatus.accepted,
          synced: backendStatus.synced,
          timestamp: backendStatus.timestamp,
        });
        
        setTermsAccepted(backendStatus.accepted);

        // If not accepted on backend, show modal (even if accepted locally)
        if (!backendStatus.accepted) {
          console.log('📋 [useUgcTerms] User has not accepted UGC terms on backend - showing modal:', { userId });
          setShowTermsModal(true);
        } else {
          console.log('✅ [useUgcTerms] User has previously accepted UGC terms (user-level, synced from backend):', { userId });
        }
      } catch (error) {
        console.error('❌ [useUgcTerms] Error checking terms status:', { userId, error });
        // On error, check local status as fallback
        try {
          const localStatus = await ugcTermsService.getUgcAcceptanceStatus(userId);
          setTermsAccepted(localStatus.accepted);
          if (!localStatus.accepted) {
            setShowTermsModal(true);
          } else {
            // Even if accepted locally, show modal if backend check failed
            // This ensures we always verify with backend
            console.log('⚠️ [useUgcTerms] Backend check failed but local says accepted - showing modal to verify:', { userId });
            setShowTermsModal(true);
          }
        } catch (localError) {
          setTermsAccepted(false);
          setShowTermsModal(true);
        }
      } finally {
        setTermsLoading(false);
      }
    };

    checkTerms();
  }, [userId]); // Re-check when userId changes

  const handleAcceptTerms = useCallback(async () => {
    try {
      console.log('🎯 [useUgcTerms] Accepting UGC terms (user-specific):', { userId });
      const success = await ugcTermsService.acceptUgcTerms(userId);
      
      if (success) {
        // If acceptUgcTerms returned true, it means the PATCH request succeeded (200/204)
        // We can trust that the backend has accepted it, even if the GET endpoint takes time to reflect it
        console.log('✅ [useUgcTerms] UGC terms accepted - PATCH request succeeded:', { userId });
        setTermsAccepted(true);
        setShowTermsModal(false);
        console.log('✅ [useUgcTerms] Modal closed - backend will sync shortly:', { userId });
        
        // Optionally verify in background (non-blocking)
        setTimeout(async () => {
          try {
            const backendStatus = await ugcTermsService.getUgcAcceptanceFromBackend(userId);
            if (backendStatus.accepted) {
              console.log('✅ [useUgcTerms] Backend verification confirmed (background check):', { userId });
            } else {
              console.warn('⚠️ [useUgcTerms] Backend verification pending (background check):', { userId });
            }
          } catch (error) {
            console.warn('⚠️ [useUgcTerms] Background verification failed (non-critical):', { userId, error });
          }
        }, 2000);
      } else {
        throw new Error('Échec de l\'acceptation des termes UGC');
      }
    } catch (error: any) {
      console.error('❌ [useUgcTerms] Error accepting terms:', { userId, error });
      throw error;
    }
  }, [userId]);

  const handleDeclineTerms = useCallback(() => {
    console.log('🔴 [useUgcTerms] User declined UGC terms - hiding modal');
    setShowTermsModal(false);
    // Don't set termsAccepted to true - user cannot access features
  }, []);

  const checkTermsStatus = useCallback(async () => {
    try {
      console.log('🔄 [useUgcTerms] Manually checking UGC terms status (user-specific):', { userId });
      const status = await ugcTermsService.getUgcAcceptanceStatus(userId);
      setTermsAccepted(status.accepted);

      if (!status.accepted) {
        setShowTermsModal(true);
      }
    } catch (error) {
      console.error('❌ [useUgcTerms] Error checking terms status:', { userId, error });
    }
  }, [userId]);

  return {
    termsAccepted,
    termsLoading,
    showTermsModal,
    setShowTermsModal,
    handleAcceptTerms,
    handleDeclineTerms,
    checkTermsStatus,
  };
};
