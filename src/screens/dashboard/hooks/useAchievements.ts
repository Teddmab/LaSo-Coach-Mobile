import { useState, useEffect, useCallback } from 'react';
import DashboardService from '../../../services/dashboardService';
import chatSocketService from '../../../services/chatSocketService';

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
    
    // Écouter les mises à jour de points via WebSocket pour rafraîchir les achievements en temps réel
    const setupWebSocketListeners = () => {
      if (!chatSocketService.getConnectionStatus()) {
        const checkConnection = setInterval(() => {
          if (chatSocketService.getConnectionStatus()) {
            clearInterval(checkConnection);
            setupWebSocketListeners();
          }
        }, 1000);
        setTimeout(() => clearInterval(checkConnection), 10000);
        return;
      }
      
      const unsubscribePoints = chatSocketService.onPointsUpdated((data: any) => {
        // Rafraîchir les achievements pour mettre à jour la progression des badges
        fetchAchievementsData();
      });
      
      const unsubscribeBadgeUnlock = chatSocketService.onBadgeLevelUnlocked((data: any) => {
        // Rafraîchir les achievements quand un niveau de badge est débloqué
        fetchAchievementsData();
      });
      
      const unsubscribeBadgeUpdate = chatSocketService.onBadgeUpdated((data: any) => {
        // Rafraîchir les achievements quand les badges sont mis à jour
        fetchAchievementsData();
      });
      
      return () => {
        unsubscribePoints();
        unsubscribeBadgeUnlock();
        unsubscribeBadgeUpdate();
      };
    };
    
    const cleanup = setupWebSocketListeners();
    
    return () => {
      if (cleanup) cleanup();
    };
  }, [fetchAchievementsData]);

  return {
    achievementsData,
    loading,
    error,
    fetchAchievementsData,
  };
};

