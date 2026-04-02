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
    'you have been assigned': 'Vous avez été assigné',
    'plan assigned': 'Plan assigné',
    'new plan assigned': 'Nouveau plan assigné',
    'new message': 'Nouveau message',
    'new message from': 'Nouveau message de',
    'new chat started': 'Nouvelle conversation démarrée',
    'message': 'Message',
    'chat': 'Chat',
    'conversation': 'Conversation',
    'sent you a message': 'vous a envoyé un message',
    'has sent you a message': 'vous a envoyé un message',
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
    'error': 'Erreur',
    'success': 'Succès',
    'notification': 'Notification',
    'test notification': 'Notification de test',
    'alert': 'Alerte',
    'warning': 'Avertissement',
    'info': 'Information',
    'reminder': 'Rappel',
    'update': 'Mise à jour',
    'new': 'Nouveau',
    'completed': 'Terminé',
    'pending': 'En attente',
    'cancelled': 'Annulé',
    'active': 'Actif',
    'inactive': 'Inactif',
  };
  
  if (exactTranslations[titleLower]) {
    return exactTranslations[titleLower];
  }
  
  const patterns: Array<{ en: RegExp; fr: string }> = [
    { en: /badge unlocked/gi, fr: 'Badge débloqué' },
    { en: /congratulations/gi, fr: 'Félicitations' },
    { en: /new content/gi, fr: 'Nouveau contenu' },
    { en: /content assigned/gi, fr: 'Contenu assigné' },
    { en: /you have been assigned/gi, fr: 'Vous avez été assigné' },
    { en: /plan assigned/gi, fr: 'Plan assigné' },
    { en: /new plan assigned/gi, fr: 'Nouveau plan assigné' },
    { en: /new chat started/gi, fr: 'Nouvelle conversation démarrée' },
    { en: /new message from/gi, fr: 'Nouveau message de' },
    { en: /new message/gi, fr: 'Nouveau message' },
    { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
    { en: /goal reached/gi, fr: 'Objectif atteint' },
    { en: /payment received/gi, fr: 'Paiement reçu' },
    { en: /payment successful/gi, fr: 'Paiement réussi' },
    { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
    { en: /subscription expired/gi, fr: 'Abonnement expiré' },
    { en: /session reminder/gi, fr: 'Rappel de session' },
    { en: /new session/gi, fr: 'Nouvelle session' },
    { en: /test notification/gi, fr: 'Notification de test' },
    { en: /\berror\b/gi, fr: 'Erreur' },
    { en: /\bsuccess\b/gi, fr: 'Succès' },
    { en: /\bnotification\b/gi, fr: 'Notification' },
    { en: /\balert\b/gi, fr: 'Alerte' },
    { en: /\bwarning\b/gi, fr: 'Avertissement' },
    { en: /\binfo\b/gi, fr: 'Information' },
    { en: /\breminder\b/gi, fr: 'Rappel' },
    { en: /\bupdate\b/gi, fr: 'Mise à jour' },
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
  
  // ✅ PHASE 1: Traductions spéciales avec préservation des noms de plans/contenus entre guillemets
  // Ces traductions doivent être faites EN PREMIER pour préserver les noms entre guillemets
  
  // Gérer "You have been assigned 'plan x' to complete" ou "You have been assigned "plan x" to complete"
  // Pattern flexible pour gérer les guillemets simples ou doubles
  translated = translated.replace(
    /you\s+have\s+been\s+assigned\s+["']([^"']+)["']\s+to\s+complete/gi,
    'Vous avez été assigné "$1" à compléter'
  );
  
  // Gérer "You have been assigned 'plan x'" (sans "to complete")
  translated = translated.replace(
    /you\s+have\s+been\s+assigned\s+["']([^"']+)["']/gi,
    'Vous avez été assigné "$1"'
  );
  
  // Gérer "You have been assigned plan x to complete" (sans guillemets)
  // Capturer le nom du plan jusqu'à "to complete" ou la fin de la phrase
  translated = translated.replace(
    /you\s+have\s+been\s+assigned\s+([^"'.!?\n]+?)\s+to\s+complete/gi,
    (match, planName) => `Vous avez été assigné ${planName.trim()} à compléter`
  );
  
  // Gérer "You have been assigned plan x" (sans guillemets, sans "to complete")
  translated = translated.replace(
    /you\s+have\s+been\s+assigned\s+([^"'.!?\n]+?)(?:\s+to\s+complete|$|\.|!|\?)/gi,
    (match, planName) => {
      const trimmed = planName.trim();
      if (trimmed.toLowerCase().includes('to complete')) {
        return `Vous avez été assigné ${trimmed.replace(/to\s+complete/gi, 'à compléter')}`;
      }
      return `Vous avez été assigné ${trimmed}`;
    }
  );
  
  // ✅ PHASE 2: Patterns de traduction généraux (phrases complètes d'abord)
  const patterns: Array<{ en: RegExp; fr: string }> = [
    // Messages de félicitations
    { en: /congratulations! you have/gi, fr: 'Félicitations ! Vous avez' },
    { en: /congratulations! you/gi, fr: 'Félicitations ! Vous' },
    { en: /congratulations, you have/gi, fr: 'Félicitations, vous avez' },
    { en: /congratulations, you/gi, fr: 'Félicitations, vous' },
    { en: /congratulations! /gi, fr: 'Félicitations ! ' },
    { en: /congratulations, /gi, fr: 'Félicitations, ' },
    { en: /congratulations/gi, fr: 'Félicitations' },
    
    // Messages de déblocage
    { en: /you have unlocked/gi, fr: 'Vous avez débloqué' },
    { en: /you've unlocked/gi, fr: 'Vous avez débloqué' },
    { en: /you unlocked/gi, fr: 'Vous avez débloqué' },
    
    // Messages de contenu et plans assignés (après les traductions spéciales ci-dessus)
    { en: /has been assigned to you/gi, fr: 'vous a été assigné' },
    { en: /to complete/gi, fr: 'à compléter' },
    { en: /new content has been assigned to you/gi, fr: 'Un nouveau contenu vous a été assigné' },
    { en: /new content has been assigned/gi, fr: 'Un nouveau contenu vous a été assigné' },
    { en: /content has been assigned to you/gi, fr: 'Un contenu vous a été assigné' },
    { en: /content has been assigned/gi, fr: 'Un contenu vous a été assigné' },
    { en: /you have new content/gi, fr: 'Vous avez un nouveau contenu' },
    { en: /new content available/gi, fr: 'Nouveau contenu disponible' },
    { en: /\bplan\b/gi, fr: 'plan' },
    
    // Messages de chat - améliorations pour réactivité
    { en: /you have a new message from/gi, fr: 'Vous avez un nouveau message de' },
    { en: /you have a new message/gi, fr: 'Vous avez un nouveau message' },
    { en: /new message from/gi, fr: 'Nouveau message de' },
    { en: /sent you a message/gi, fr: 'vous a envoyé un message' },
    { en: /started a conversation with you/gi, fr: 'a démarré une conversation avec vous' },
    { en: /new chat started/gi, fr: 'Nouvelle conversation démarrée' },
    { en: /has sent you a message/gi, fr: 'vous a envoyé un message' },
    { en: /wants to chat with you/gi, fr: 'souhaite discuter avec vous' },
    { en: /is typing/gi, fr: 'est en train d\'écrire' },
    { en: /message received/gi, fr: 'Message reçu' },
    { en: /chat message/gi, fr: 'Message de chat' },
    { en: /conversation/gi, fr: 'conversation' },
    
    // Messages de session
    { en: /your session is starting soon/gi, fr: 'Votre session commence bientôt' },
    { en: /your session is starting/gi, fr: 'Votre session commence' },
    { en: /you have a session/gi, fr: 'Vous avez une session' },
    { en: /session reminder/gi, fr: 'Rappel de session' },
    { en: /session scheduled/gi, fr: 'Session programmée' },
    
    // Messages de paiement
    { en: /your payment was successful/gi, fr: 'Votre paiement a réussi' },
    { en: /payment received successfully/gi, fr: 'Paiement reçu avec succès' },
    { en: /payment received/gi, fr: 'Paiement reçu' },
    { en: /payment successful/gi, fr: 'Paiement réussi' },
    { en: /payment failed/gi, fr: 'Paiement échoué' },
    
    // Messages d'abonnement
    { en: /subscription has been updated/gi, fr: 'L\'abonnement a été mis à jour' },
    { en: /subscription updated/gi, fr: 'Abonnement mis à jour' },
    { en: /subscription expired/gi, fr: 'Abonnement expiré' },
    { en: /subscription renewed/gi, fr: 'Abonnement renouvelé' },
    { en: /subscription cancelled/gi, fr: 'Abonnement annulé' },
    { en: /manage your subscription/gi, fr: 'Gérez votre abonnement' },
    { en: /on the web at/gi, fr: 'sur le web à' },
    
    // Messages d'objectifs
    { en: /you have reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
    { en: /you've reached your goal/gi, fr: 'Vous avez atteint votre objectif' },
    { en: /you have reached/gi, fr: 'Vous avez atteint' },
    { en: /you've reached/gi, fr: 'Vous avez atteint' },
    { en: /goal reached/gi, fr: 'Objectif atteint' },
    
    // Messages de points et succès
    { en: /you have earned/gi, fr: 'Vous avez gagné' },
    { en: /you've earned/gi, fr: 'Vous avez gagné' },
    { en: /you earned/gi, fr: 'Vous avez gagné' },
    { en: /achievement unlocked/gi, fr: 'Succès débloqué' },
    { en: /points awarded/gi, fr: 'Points attribués' },
    { en: /points earned/gi, fr: 'Points gagnés' },
    
    // Messages d'action
    { en: /click here to/gi, fr: 'Cliquez ici pour' },
    { en: /tap to/gi, fr: 'Appuyez pour' },
    { en: /view more/gi, fr: 'Voir plus' },
    { en: /see details/gi, fr: 'Voir les détails' },
    { en: /open/gi, fr: 'Ouvrir' },
    { en: /close/gi, fr: 'Fermer' },
    
    // Messages d'erreur
    { en: /an error occurred/gi, fr: 'Une erreur s\'est produite' },
    { en: /something went wrong/gi, fr: 'Quelque chose s\'est mal passé' },
    { en: /error occurred/gi, fr: 'Erreur survenue' },
    { en: /failed to/gi, fr: 'Échec de' },
    { en: /unable to/gi, fr: 'Impossible de' },
    { en: /cannot/gi, fr: 'Ne peut pas' },
    { en: /please try again/gi, fr: 'Veuillez réessayer' },
    { en: /try again/gi, fr: 'Réessayer' },
    { en: /invalid/gi, fr: 'Invalide' },
    { en: /not found/gi, fr: 'Introuvable' },
    { en: /already completed/gi, fr: 'Déjà complété' },
    { en: /already marked/gi, fr: 'Déjà marqué' },
    { en: /unauthorized/gi, fr: 'Non autorisé' },
    { en: /forbidden/gi, fr: 'Accès refusé' },
    { en: /network error/gi, fr: 'Erreur réseau' },
    { en: /timeout/gi, fr: 'Délai d\'attente dépassé' },
    { en: /server error/gi, fr: 'Erreur serveur' },
    { en: /bad request/gi, fr: 'Requête invalide' },
    
    // Messages généraux
    { en: /this is a test notification/gi, fr: 'Ceci est une notification de test' },
    { en: /from laso coach/gi, fr: 'de LaSo Coach' },
    { en: /loading/gi, fr: 'Chargement' },
    { en: /please wait/gi, fr: 'Veuillez patienter' },
    { en: /success/gi, fr: 'Succès' },
    { en: /error/gi, fr: 'Erreur' },
    { en: /info/gi, fr: 'Information' },
    { en: /warning/gi, fr: 'Avertissement' },
    
    // Messages avec pronoms et verbes (en dernier pour éviter de remplacer dans les traductions spéciales)
    { en: /\byou have been assigned\b/gi, fr: 'Vous avez été assigné' },
    { en: /\byou have been\b/gi, fr: 'Vous avez été' },
    { en: /\byou're\b/gi, fr: 'vous êtes' },
    { en: /\byou are\b/gi, fr: 'vous êtes' },
    { en: /\bhave been\b/gi, fr: 'avez été' },
    { en: /\bhas been\b/gi, fr: 'a été' },
    { en: /\bassigned\b/gi, fr: 'assigné' },
    { en: /\bcomplete\b/gi, fr: 'compléter' },
    { en: /\bcompleted\b/gi, fr: 'complété' },
    { en: /\bcompleting\b/gi, fr: 'complétant' },
  ];
  
  patterns.forEach(({ en, fr }) => {
    translated = translated.replace(en, fr);
  });
  
  return translated;
};

