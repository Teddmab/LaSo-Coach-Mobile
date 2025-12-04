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
      console.log('🏠 Dashboard: Fetching data for home tab...');
      
      // Fetch dashboard data and profile data in parallel
      const [dashboardData, profileData] = await Promise.all([
        DashboardService.getDashboardData(),
        ProfileApi.getProfile()
      ]);
      
      // Merge profile data with dashboard data to ensure we have the latest avatar
      const enhancedData: any = {
        ...dashboardData,
        profile: {
          ...(dashboardData as any)?.profile,
          ...profileData,
          avatar: (profileData as any)?.avatar || (dashboardData as any)?.profile?.avatar
        }
      };
      
      setDashboardData(enhancedData);
      console.log('🏠 Dashboard: Data loaded successfully with latest profile info');
    } catch (error: any) {
      console.error('❌ Dashboard: Error fetching dashboard data:', error);
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

