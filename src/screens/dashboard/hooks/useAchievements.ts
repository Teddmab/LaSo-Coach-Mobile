import { useState, useEffect, useCallback } from 'react';
import AchievementsApi from '../../../services/achievementsApi';

export const useAchievements = () => {
  const [achievementsData, setAchievementsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAchievementsData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏆 Dashboard: Fetching achievements data...');
      const data = await AchievementsApi.getAchievementsSummary();
      setAchievementsData(data);
      console.log('✅ Dashboard: Achievements data loaded successfully');
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

