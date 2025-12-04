import { RendezvousStatus, StatusMeta, MeetingProvider } from '../types';
import { theme } from '../../../constants/theme';

export const getStatusMeta = (status?: RendezvousStatus): StatusMeta => {
  switch (status) {
    case 'PENDING':
      return {
        badge: 'En attente du coach',
        badgeColor: '#9E9E9E',
        bgColor: 'rgba(158,158,158,0.1)',
        icon: 'time-outline',
        message: 'Votre coach examine votre demande. Préparez vos questions.',
      };
    case 'ASSIGNED':
      return {
        badge: 'Coach assigné',
        badgeColor: '#FF9800',
        bgColor: 'rgba(255,152,0,0.1)',
        icon: 'checkmark-circle-outline',
        message: 'Votre coach est réservé. Préparez vos questions.',
      };
    case 'CONFIRMED':
      return {
        badge: 'Confirmé',
        badgeColor: theme.colors.success,
        bgColor: 'rgba(76,175,80,0.1)',
        icon: 'checkmark-circle',
        message: 'Votre session est confirmée. Ajoutez un rappel à votre calendrier.',
      };
    default:
      return {
        badge: 'Non programmé',
        badgeColor: '#757575',
        bgColor: '#F5F5F5',
        icon: 'calendar-outline',
        message: 'Planifiez votre premier rendez-vous pour commencer votre coaching.',
      };
  }
};

export const formatDateLabel = (date?: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
  return dateObj.toLocaleDateString('fr-FR', options);
};

export const formatTimeLabel = (date?: Date | string): string => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

export const getDaysUntil = (targetDate?: Date | string): string => {
  if (!targetDate) return '';
  const now = new Date();
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const diff = target.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days < 0) return `Passé depuis ${Math.abs(days)} jour${Math.abs(days) > 1 ? 's' : ''}`;
  if (days === 0) return "C'est aujourd'hui !";
  if (days === 1) return 'Dans 1 jour';
  return `${days} jours restants`;
};

export const getMeetingProviderLabel = (provider?: MeetingProvider | string): string => {
  const labels: Record<string, string> = {
    GOOGLE_MEET: 'Google Meet',
    ZOOM: 'Zoom',
    TEAMS: 'Microsoft Teams',
    PHONE: 'Appel téléphonique',
  };
  return labels[provider || ''] || provider || '';
};

export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

export const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

