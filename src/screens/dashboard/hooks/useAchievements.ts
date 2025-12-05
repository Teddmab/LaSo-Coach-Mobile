import { useState, useEffect, useCallback } from 'react';
import DashboardService from '../../../services/dashboardService';

export const useAchievements = () => {
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievementsData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏆 Dashboard: Fetching achievements data (DashboardService)...');

      // Utiliser la même logique que AchievementsScreen pour avoir des points/badges cohérents
      const data = await DashboardService.getAchievementsSummary();
      setAchievementsData(data);
      console.log('✅ Dashboard: Achievements data loaded successfully (DashboardService)', data);
    } catch (error: any) {
      console.error('❌ Dashboard: Error fetching achievements data:', error);
      setError(error.message || 'Erreur lors du chargement des achievements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievementsData();
  }, [fetchAchievementsData]);

  return {
    achievementsData,
    loading,
    error,
    fetchAchievementsData,
  };
};

