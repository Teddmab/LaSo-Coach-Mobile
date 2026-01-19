import { useState, useEffect, useCallback } from 'react';
import DashboardService from '../../../services/dashboardService';
import { ProfileApi } from '../../../services/profileApi';

export const useDashboardData = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch dashboard data and profile data in parallel
      const [dashboardData, profileData] = await Promise.all([
        DashboardService.getDashboardData(),
        ProfileApi.getProfile().catch(() => null) // Handle Prisma errors gracefully
      ]);
      
      // Merge profile data with dashboard data to ensure we have the latest avatar
      // Handle case where profileData might be null due to Prisma errors
      const enhancedData: any = {
        ...dashboardData,
        profile: {
          ...(dashboardData as any)?.profile,
          ...(profileData || {}), // Use empty object if profileData is null
          avatar: (profileData as any)?.avatar || (dashboardData as any)?.Profile?.avatar || (dashboardData as any)?.profile?.avatar
        }
      };
      
      setDashboardData(enhancedData);
    } catch (error: any) {
      setError(error.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    setDashboardData,
  };
};

