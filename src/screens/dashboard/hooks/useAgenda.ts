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
      console.log('📅 Dashboard: Fetching agenda data...');
      const response: any = await AgendaApi.getAgenda();
      setAgendaData(response.data || []);
      console.log('✅ Dashboard: Agenda data loaded successfully');
    } catch (error: any) {
      console.error('❌ Dashboard: Error fetching agenda data:', error);
      setError(error.message || 'Erreur lors du chargement de l\'agenda');
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

