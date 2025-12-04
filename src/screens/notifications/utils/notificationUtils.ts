import { NotificationIcon, Notification } from '../types';

export const getNotificationIcon = (type: string): NotificationIcon => {
  switch (type) {
    case 'chat_message':
      return { name: 'chatbubble-ellipses', color: '#2196F3' };
    case 'content_assigned':
      return { name: 'document-text', color: '#4CAF50' };
    case 'session':
      return { name: 'calendar', color: '#FF9800' };
    case 'system':
      return { name: 'settings', color: '#9C27B0' };
    case 'payment':
      return { name: 'card', color: '#F44336' };
    default:
      return { name: 'information-circle', color: '#2196F3' };
  }
};

export const formatNotificationTime = (createdAt?: string): string => {
  if (!createdAt) return 'Récemment';
  
  const now = new Date();
  const notificationDate = new Date(createdAt);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'À l\'instant';
  if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  
  return notificationDate.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const translateNotificationTitle = (title?: string): string => {
  if (!title) return title || '';
  
  const titleLower = title.toLowerCase().trim();
  
  const exactTranslations: Record<string, string> = {
    'badge unlocked': 'Badge débloqué',
    'badge unlocked!': 'Badge débloqué !',
    'congratulations': 'Félicitations',
    'congratulations!': 'Félicitations !',
    'new content': 'Nouveau contenu',
    'new content assigned': 'Nouveau contenu assigné',
    'content assigned': 'Contenu assigné',
    'new message': 'Nouveau message',
    'new session': 'Nouvelle session',
    'session reminder': 'Rappel de session',
    'payment received': 'Paiement reçu',
    'payment successful': 'Paiement réussi',
    'subscription updated': 'Abonnement mis à jour',
    'subscription expired': 'Abonnement expiré',
    'achievement unlocked': 'Succès débloqué',
    'achievement unlocked!': 'Succès débloqué !',
    'goal reached': 'Objectif atteint',
    'goal reached!': 'Objectif atteint !',
    'welcome': 'Bienvenue',
    'welcome!': 'Bienvenue !',
  };
  
  if (exactTranslations[titleLower]) {
    return exactTranslations[titleLower];
  }
  
  const patterns: Array<{ en: RegExp; fr: string }> = [
    { en: /badge unlocked/gi, fr: 'Badge débloqué' },
    { en: /congratulations/gi, fr: 'Félicitations' },
    { en: /new content/gi, fr: 'Nouveau contenu' },
    { en: /content assigned/gi, fr: 'Contenu assigné' },
    { en: /new message/gi, fr: 'Nouveau message' },
    { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
    { en: /goal reached/gi, fr: 'Objectif atteint' },
    { en: /payment received/gi, fr: 'Paiement reçu' },
    { en: /payment successful/gi, fr: 'Paiement réussi' },
    { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
    { en: /subscription expired/gi, fr: 'Abonnement expiré' },
    { en: /session reminder/gi, fr: 'Rappel de session' },
    { en: /new session/gi, fr: 'Nouvelle session' },
  ];
  
  let translated = title;
  patterns.forEach(({ en, fr }) => {
    translated = translated.replace(en, fr);
  });
  
  return translated;
};

export const translateNotificationMessage = (message?: string): string => {
  if (!message) return message || '';
  
  let translated = message;
  
  const patterns: Array<{ en: RegExp; fr: string }> = [
    { en: /congratulations! you have/gi, fr: 'Félicitations ! Vous avez' },
    { en: /congratulations! you/gi, fr: 'Félicitations ! Vous' },
    { en: /congratulations, you have/gi, fr: 'Félicitations, vous avez' },
    { en: /congratulations, you/gi, fr: 'Félicitations, vous' },
    { en: /congratulations! /gi, fr: 'Félicitations ! ' },
    { en: /congratulations, /gi, fr: 'Félicitations, ' },
    { en: /you have unlocked/gi, fr: 'Vous avez débloqué' },
    { en: /you've unlocked/gi, fr: 'Vous avez débloqué' },
    { en: /you unlocked/gi, fr: 'Vous avez débloqué' },
    { en: /new content has been assigned to you/gi, fr: 'Un nouveau contenu vous a été assigné' },
    { en: /new content has been assigned/gi, fr: 'Un nouveau contenu vous a été assigné' },
    { en: /content has been assigned to you/gi, fr: 'Un contenu vous a été assigné' },
    { en: /content has been assigned/gi, fr: 'Un contenu vous a été assigné' },
    { en: /you have new content/gi, fr: 'Vous avez un nouveau contenu' },
    { en: /new content available/gi, fr: 'Nouveau contenu disponible' },
    { en: /you have a new message from/gi, fr: 'Vous avez un nouveau message de' },
    { en: /you have a new message/gi, fr: 'Vous avez un nouveau message' },
    { en: /new message from/gi, fr: 'Nouveau message de' },
    { en: /your session is starting soon/gi, fr: 'Votre session commence bientôt' },
    { en: /your session is starting/gi, fr: 'Votre session commence' },
    { en: /you have a session/gi, fr: 'Vous avez une session' },
    { en: /session reminder/gi, fr: 'Rappel de session' },
    { en: /your payment was successful/gi, fr: 'Votre paiement a réussi' },
    { en: /payment received successfully/gi, fr: 'Paiement reçu avec succès' },
    { en: /payment received/gi, fr: 'Paiement reçu' },
    { en: /subscription has been updated/gi, fr: 'L\'abonnement a été mis à jour' },
    { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
    { en: /subscription expired/gi, fr: 'Abonnement expiré' },
    { en: /you have reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
    { en: /you've reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
    { en: /you have reached/gi, fr: 'Vous avez atteint' },
    { en: /you've reached/gi, fr: 'Vous avez atteint' },
    { en: /goal reached/gi, fr: 'Objectif atteint' },
    { en: /you have earned/gi, fr: 'Vous avez gagné' },
    { en: /you've earned/gi, fr: 'Vous avez gagné' },
    { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
    { en: /click here to/gi, fr: 'Cliquez ici pour' },
    { en: /tap to/gi, fr: 'Appuyez pour' },
    { en: /view more/gi, fr: 'Voir plus' },
    { en: /see details/gi, fr: 'Voir les détails' },
  ];
  
  patterns.forEach(({ en, fr }) => {
    translated = translated.replace(en, fr);
  });
  
  return translated;
};

