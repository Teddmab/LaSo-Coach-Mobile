import { useState, useEffect, useCallback } from 'react';
import Toast from 'react-native-toast-message';
import { ProfileApi } from '../../../services/profileApi';
import { RendezvousData, RendezvousFormData } from '../types';

export const useAgenda = () => {
  const [rendezvousLoading, setRendezvousLoading] = useState<boolean>(true);
  const [rendezvousData, setRendezvousData] = useState<RendezvousData | null>(null);
  const [showRendezvousForm, setShowRendezvousForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [formData, setFormData] = useState<RendezvousFormData>({
    scheduledAt: '',
    subject: 'Session de lancement',
    duration: 60,
    notes: '',
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const data = await ProfileApi.getProfile();
        setProfileData(data);
      } catch (error) {
      }
    };
    fetchProfile();
  }, []);

  // Fetch rendezvous
  const fetchRendezvous = useCallback(async (): Promise<void> => {
    try {
      setRendezvousLoading(true);
      const data: any = await ProfileApi.getCurrentRendezvous();
      setRendezvousData(data as RendezvousData);
      setShowRendezvousForm(!data);
    } catch (error) {
      setRendezvousData(null);
      setShowRendezvousForm(true);
    } finally {
      setRendezvousLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRendezvous();
  }, [fetchRendezvous]);

  const handleSubmitRendezvous = async (): Promise<void> => {
    if (!formData.scheduledAt) {
      Toast.show({
        type: 'error',
        text1: 'Date requise',
        text2: 'Veuillez sélectionner une date et heure',
      });
      return;
    }

    const selectedDate = new Date(formData.scheduledAt);
    const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (selectedDate < minDate) {
      Toast.show({
        type: 'error',
        text1: 'Date invalide',
        text2: 'Le rendez-vous doit être prévu au moins 24h à l\'avance',
      });
      return;
    }

    if (!formData.subject || formData.subject.length > 500) {
      Toast.show({
        type: 'error',
        text1: 'Sujet requis',
        text2: 'Le sujet est obligatoire (max 500 caractères)',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        subject: formData.subject,
        duration: parseInt(formData.duration.toString()),
        notes: formData.notes,
      };

      await ProfileApi.createRendezvous(payload);
      await ProfileApi.updateProgress({
        step: 'rendezvous',
        completed: true,
      });

      Toast.show({
        type: 'success',
        text1: 'Rendez-vous enregistré',
        text2: 'Votre demande a été envoyée avec succès',
      });

      await fetchRendezvous();
      setShowRendezvousForm(false);
    } catch (error: any) {
      
      if (error.response?.status === 409) {
        Toast.show({
          type: 'error',
          text1: 'Créneau indisponible',
          text2: 'Ce créneau n\'est plus disponible.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Erreur',
          text2: 'Impossible de créer le rendez-vous.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = (): void => {
    if (rendezvousData?.status === 'CONFIRMED') {
      Toast.show({
        type: 'info',
        text1: 'Rendez-vous confirmé',
        text2: 'Contactez le support pour modifier',
      });
      return;
    }

    setFormData({
      scheduledAt: rendezvousData?.scheduledAt || '',
      subject: rendezvousData?.subject || 'Session de lancement',
      duration: rendezvousData?.duration || 60,
      notes: rendezvousData?.notes || '',
    });
    setShowRendezvousForm(true);
  };

  return {
    rendezvousLoading,
    rendezvousData,
    showRendezvousForm,
    submitting,
    profileData,
    formData,
    setFormData,
    setShowRendezvousForm,
    handleSubmitRendezvous,
    handleReschedule,
    refetchRendezvous: fetchRendezvous,
  };
};

