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

      // Utiliser la même logique que AchievementsScreen pour avoir des points/badges cohérents
      const data = await DashboardService.getAchievementsSummary();
      setAchievementsData(data);
    } catch (error: any) {
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

