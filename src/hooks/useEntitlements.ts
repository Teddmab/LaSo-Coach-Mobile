/**
 * useEntitlements Hook
 * 
 * Provides access to user entitlements throughout the app.
 * Components use this to determine what features user can access.
 * 
 * Phase 6: Implement Entitlements System
 */

import { useState, useEffect } from 'react';
import EntitlementsApi, { Entitlements } from '../services/entitlementsApi';
import { useAuth } from '../context/FirebaseAuthContext';
import { isIOSCompanionMode } from '../config/featureFlags';

export const useEntitlements = () => {
  const { user, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlements>(EntitlementsApi.getDefaultEntitlements());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntitlements = async () => {
      try {
        if (isIOSCompanionMode()) {
          setEntitlements(EntitlementsApi.getDefaultEntitlements());
          setError(null);
          setLoading(false);
          return;
        }

        if (!isAuthenticated || !user) {
          // Not authenticated, use defaults
          setEntitlements(EntitlementsApi.getDefaultEntitlements());
          setLoading(false);
          return;
        }

        // TODO: PHASE 6 - Load entitlements on auth/component mount
        setLoading(true);
        const fetchedEntitlements = await EntitlementsApi.getUserEntitlements();
        setEntitlements(fetchedEntitlements);
        setError(null);
      } catch (err) {
        console.error('❌ [useEntitlements] Error loading entitlements:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setEntitlements(EntitlementsApi.getDefaultEntitlements());
      } finally {
        setLoading(false);
      }
    };

    loadEntitlements();
  }, [user, isAuthenticated]);

  // TODO: PHASE 6 - Helper function to check if feature is accessible
  const canAccess = (feature: keyof Omit<Entitlements, 'id' | 'userId' | 'subscriptionStatus' | 'subscriptionExpiresAt' | 'lastUpdated'>): boolean => {
    return EntitlementsApi.canAccessFeature(entitlements, feature);
  };

  // TODO: PHASE 6 - Helper function to refresh entitlements (call after subscription changes)
  const refresh = async () => {
    try {
      setLoading(true);
      const refreshed = await EntitlementsApi.refreshEntitlements();
      setEntitlements(refreshed);
      return true;
    } catch (err) {
      console.error('❌ [useEntitlements] Failed to refresh:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    entitlements,
    loading,
    error,
    canAccess,
    refresh,
    // Convenience properties
    hasNutritionAccess: canAccess('canAccessNutrition'),
    hasChatAccess: canAccess('canAccessChat'),
    hasAnalyticsAccess: canAccess('canAccessAdvancedAnalytics'),
    hasCoachingAccess: canAccess('canAccessCoachingPlans'),
    hasDietAccess: canAccess('canAccessDietPlans'),
    isSubscriptionActive: entitlements.subscriptionStatus === 'ACTIVE',
  };
};
