import { useState, useEffect, useCallback } from 'react';
import * as ugcTermsService from '../services/ugcTermsService';

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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsLoading, setTermsLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Check if user has accepted terms on mount
  useEffect(() => {
    const checkTerms = async () => {
      try {
        console.log('🔍 [useUgcTerms] Checking UGC terms status...');
        setTermsLoading(true);

        const status = await ugcTermsService.getUgcAcceptanceStatus();
        setTermsAccepted(status.accepted);

        // If not accepted, show modal
        if (!status.accepted) {
          console.log('📋 [useUgcTerms] User has not accepted UGC terms - showing modal');
          setShowTermsModal(true);
        } else {
          console.log('✅ [useUgcTerms] User has previously accepted UGC terms');
        }

        // Sync with backend in background
        const backendStatus = await ugcTermsService.syncUgcAcceptanceWithBackend();
        if (!backendStatus.synced && backendStatus.accepted) {
          console.warn('⚠️ [useUgcTerms] UGC terms sync incomplete - will retry on next action');
        }
      } catch (error) {
        console.error('❌ [useUgcTerms] Error checking terms status:', error);
        setTermsAccepted(false);
      } finally {
        setTermsLoading(false);
      }
    };

    checkTerms();
  }, []);

  const handleAcceptTerms = useCallback(async () => {
    try {
      console.log('🎯 [useUgcTerms] Accepting UGC terms...');
      await ugcTermsService.acceptUgcTerms();
      setTermsAccepted(true);
      setShowTermsModal(false);
      console.log('✅ [useUgcTerms] UGC terms accepted');
    } catch (error) {
      console.error('❌ [useUgcTerms] Error accepting terms:', error);
      throw error;
    }
  }, []);

  const handleDeclineTerms = useCallback(() => {
    console.log('🔴 [useUgcTerms] User declined UGC terms - hiding modal');
    setShowTermsModal(false);
    // Don't set termsAccepted to true - user cannot access features
  }, []);

  const checkTermsStatus = useCallback(async () => {
    try {
      console.log('🔄 [useUgcTerms] Manually checking UGC terms status...');
      const status = await ugcTermsService.getUgcAcceptanceStatus();
      setTermsAccepted(status.accepted);

      if (!status.accepted) {
        setShowTermsModal(true);
      }
    } catch (error) {
      console.error('❌ [useUgcTerms] Error checking terms status:', error);
    }
  }, []);

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
