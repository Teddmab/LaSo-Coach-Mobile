import { useState, useEffect, useCallback } from 'react';
import { AgendaApi } from '../../../services/agendaApi';

export const useAgenda = () => {
  const [agendaData, setAgendaData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAgendaData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // ✅ CORRECTION: AgendaApi.getAgenda() retourne déjà un tableau directement, pas un objet avec .data
      // Voir agendaApi.ts ligne 75: return agendaItems;
      const agendaItems = await AgendaApi.getAgenda();
      
      if (__DEV__) {
        console.log('📰 [useAgenda] Agenda items récupérés:', {
          count: Array.isArray(agendaItems) ? agendaItems.length : 0,
          items: Array.isArray(agendaItems) ? agendaItems.map((item: any) => ({
            id: item.id,
            type: item.type,
            title: item.title || item.content?.title,
            hasContent: !!item.content,
          })) : [],
        });
      }
      
      // ✅ Utiliser directement le tableau retourné par AgendaApi.getAgenda()
      setAgendaData(Array.isArray(agendaItems) ? agendaItems : []);
    } catch (error: any) {
      // Pour les erreurs 502 (Bad Gateway), réduire le niveau de log
      const is502Error = error.response?.status === 502 || error.status === 502;
      
      if (is502Error) {
        // Erreur 502 souvent temporaire - log silencieux
        if (__DEV__) {
          console.warn('⚠️ [useAgenda] Serveur temporairement indisponible (502) - Réessayez dans quelques minutes');
        }
      } else {
        console.error('❌ [useAgenda] Erreur lors du chargement de l\'agenda:', error);
      }
      
      setError(error.message || 'Erreur lors du chargement de l\'agenda');
      setAgendaData([]); // S'assurer qu'on a toujours un tableau vide en cas d'erreur
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  return {
    agendaData,
    loading,
    error,
    fetchAgendaData,
  };
};

