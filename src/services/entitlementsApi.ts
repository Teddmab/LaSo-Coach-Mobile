/**
 * Entitlements API Service
 * 
 * Fetches user entitlements from the backend to determine what premium features
 * the user is allowed to access. This replaces local IAP-based feature unlocking.
 * 
 * Phase 6: Implement Entitlements System
 */

import api from './api';
import { isIOSCompanionMode } from '../config/featureFlags';

export interface Entitlements {
  id: string;
  userId: string;
  // TODO: PHASE 6 - Define entitlements flags from backend
  // These should come from server based on user's subscription status
  canAccessNutrition: boolean;
  canAccessChat: boolean;
  canAccessAdvancedAnalytics: boolean;
  canAccessCoachingPlans: boolean;
  canAccessDietPlans: boolean;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIAL' | 'NONE';
  subscriptionExpiresAt?: string;
  lastUpdated: string;
}

class EntitlementsApi {
  /**
   * Fetch user's entitlements from backend
   * TODO: PHASE 6 - Call backend entitlements endpoint
   * Returns what features user is entitled to access
   */
  static async getUserEntitlements(): Promise<Entitlements> {
    // In iOS companion mode, skip all entitlement network calls and return minimal access
    if (isIOSCompanionMode()) {
      return this.getDefaultEntitlements();
    }

    try {
      const response = await api.get<Entitlements>('/entitlements');
      return response.data;
    } catch (error: any) {
      // Pour les erreurs 502 (Bad Gateway), réduire le niveau de log
      const is502Error = error.response?.status === 502 || error.status === 502;
      
      if (is502Error) {
        // Erreur 502 souvent temporaire - log silencieux
        if (__DEV__) {
          console.warn('⚠️ [Entitlements] Serveur temporairement indisponible (502)');
        }
      } else {
        console.warn('⚠️ [Entitlements] Failed to fetch entitlements:', error);
      }
      
      // Return minimal entitlements if fetch fails
      return this.getDefaultEntitlements();
    }
  }

  /**
   * Get default entitlements (no premium access)
   * TODO: PHASE 6 - Used when entitlements cannot be fetched
   * Ensures app doesn't crash, users just see free features
   */
  static getDefaultEntitlements(): Entitlements {
    return {
      id: 'default',
      userId: '',
      canAccessNutrition: false,
      canAccessChat: false,
      canAccessAdvancedAnalytics: false,
      canAccessCoachingPlans: false,
      canAccessDietPlans: false,
      subscriptionStatus: 'NONE',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Check if user can access a specific feature
   * TODO: PHASE 6 - Used by components to gate premium features
   */
  static canAccessFeature(entitlements: Entitlements, feature: keyof Omit<Entitlements, 'id' | 'userId' | 'subscriptionStatus' | 'subscriptionExpiresAt' | 'lastUpdated'>): boolean {
    if (!entitlements) {
      return false;
    }
    return entitlements[feature] as boolean === true;
  }

  /**
   * Refresh entitlements (call this after subscription changes)
   * TODO: PHASE 6 - Useful after payment to get updated entitlements
   */
  static async refreshEntitlements(): Promise<Entitlements> {
    if (isIOSCompanionMode()) {
      return this.getDefaultEntitlements();
    }

    try {
      return await this.getUserEntitlements();
    } catch (error) {
      console.error('❌ [Entitlements] Failed to refresh:', error);
      return this.getDefaultEntitlements();
    }
  }
}

export default EntitlementsApi;
