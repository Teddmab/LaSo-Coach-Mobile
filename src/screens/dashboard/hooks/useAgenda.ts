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
      const response: any = await AgendaApi.getAgenda();
      setAgendaData(response.data || []);
    } catch (error: any) {
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

