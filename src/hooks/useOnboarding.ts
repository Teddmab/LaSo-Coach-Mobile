import { useState } from 'react';
import OnboardingApi from '../services/onboardingApi';
import { useAuth } from '../context/FirebaseAuthContext';

interface ProfileData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  country: string;
  height: string;
  initialWeight: string;
  initialWaistSize: string;
  gender: string;
  occupation: string;
}

interface GoalsData {
  targetWeight: string;
  targetWaistSize: string;
  goal?: string;
  goals?: string[];
  dietaryRestrictions?: string[];
}

interface RendezVousData {
  scheduledAt: string;
  subject: string;
  duration: number;
  notes?: string;
}

interface OnboardingResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Hook for managing onboarding flow (4 steps)
 * Based on admin implementation
 */
export const useOnboarding = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Étape 1/4 : Complete Profile Setup
   * Points: 100
   */
  const completeProfileSetup = async (profileData: ProfileData): Promise<OnboardingResult> => {
    if (!user?.id) {
      const err = 'User not authenticated';
      setError(err);
      return { success: false, error: err };
    }

    setLoading(true);
    setError(null);
    try {
      const result = await OnboardingApi.completeProfileSetup(user.id, profileData);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const err = result.error || 'Failed to complete Profile Setup';
        setError(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete Profile Setup';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Étape 2/4 : Complete Goals Setup
   * Points: 30
   */
  const completeGoalsSetup = async (goalsData: GoalsData): Promise<OnboardingResult> => {
    if (!user?.id) {
      const err = 'User not authenticated';
      setError(err);
      return { success: false, error: err };
    }

    setLoading(true);
    setError(null);
    try {
      const result = await OnboardingApi.completeGoalsSetup(user.id, goalsData);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const err = result.error || 'Failed to complete Goals Setup';
        setError(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete Goals Setup';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Étape 3/4 : Complete Recommendations
   * Points: 20
   */
  const completeRecommendations = async (photoConsent: boolean): Promise<OnboardingResult> => {
    if (!user?.id) {
      const err = 'User not authenticated';
      setError(err);
      return { success: false, error: err };
    }

    setLoading(true);
    setError(null);
    try {
      const result = await OnboardingApi.completeRecommendations(user.id, photoConsent);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const err = result.error || 'Failed to complete Recommendations';
        setError(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete Recommendations';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Étape 4/4 : Complete Rendez-vous
   * Points: 25
   */
  const completeRendezVous = async (rendezVousData: RendezVousData): Promise<OnboardingResult> => {
    if (!user?.id) {
      const err = 'User not authenticated';
      setError(err);
      return { success: false, error: err };
    }

    setLoading(true);
    setError(null);
    try {
      const result = await OnboardingApi.completeRendezVous(user.id, rendezVousData);
      if (result.success) {
        return { success: true, data: result.data };
      } else {
        const err = result.error || 'Failed to complete Rendez-vous';
        setError(err);
        return { success: false, error: err };
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete Rendez-vous';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    completeProfileSetup,
    completeGoalsSetup,
    completeRecommendations,
    completeRendezVous,
  };
};

export type { ProfileData, GoalsData, RendezVousData, OnboardingResult };

