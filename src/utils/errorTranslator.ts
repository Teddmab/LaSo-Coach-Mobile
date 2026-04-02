/**
 * Fonction utilitaire pour traduire les messages d'erreur en anglais en français
 * Utilisée pour les notifications, toasts et messages d'erreur affichés à l'utilisateur
 */
export const translateErrorMessage = (errorMessage: string | undefined | null): string => {
  if (!errorMessage) return 'Erreur inconnue';
  
  let translated = errorMessage;
  
  // Traductions exactes (priorité haute)
  const exactTranslations: Record<string, string> = {
    'already completed': 'déjà complété',
    'already marked': 'déjà marqué',
    'not found': 'introuvable',
    'unauthorized': 'non autorisé',
    'forbidden': 'accès refusé',
    'access denied': 'accès refusé',
    'network error': 'erreur réseau',
    'timeout': 'délai d\'attente dépassé',
    'server error': 'erreur serveur',
    'bad request': 'requête invalide',
    'internal server error': 'erreur interne du serveur',
    'service unavailable': 'service indisponible',
    'too many requests': 'trop de requêtes',
    'invalid token': 'jeton invalide',
    'token expired': 'jeton expiré',
    'subscription required': 'abonnement requis',
    'active subscription required': 'abonnement actif requis',
    'meal already completed': 'repas déjà complété',
    'meal not found': 'repas introuvable',
    'plan not found': 'plan introuvable',
    'user not found': 'utilisateur introuvable',
    'please try again': 'veuillez réessayer',
    'try again': 'réessayer',
    'something went wrong': 'quelque chose s\'est mal passé',
    'an error occurred': 'une erreur s\'est produite',
    'error occurred': 'erreur survenue',
    'failed to': 'échec de',
    'unable to': 'impossible de',
    'cannot': 'ne peut pas',
    'invalid': 'invalide',
    'loading': 'chargement',
    'please wait': 'veuillez patienter',
  };
  
  const errorLower = errorMessage.toLowerCase().trim();
  
  // Vérifier les traductions exactes d'abord
  for (const [en, fr] of Object.entries(exactTranslations)) {
    if (errorLower === en || errorLower.includes(en)) {
      // Remplacer en préservant la casse originale
      translated = translated.replace(new RegExp(en, 'gi'), (match) => {
        // Préserver la casse du premier caractère
        const firstChar = match[0];
        const isUpperCase = firstChar === firstChar.toUpperCase();
        return isUpperCase ? fr.charAt(0).toUpperCase() + fr.slice(1) : fr;
      });
    }
  }
  
  // Patterns de traduction (pour les phrases complètes)
  const patterns: Array<{ en: RegExp; fr: string }> = [
    { en: /meal already completed/gi, fr: 'repas déjà complété' },
    { en: /meal not found/gi, fr: 'repas introuvable' },
    { en: /plan not found/gi, fr: 'plan introuvable' },
    { en: /user not found/gi, fr: 'utilisateur introuvable' },
    { en: /already completed for this plan/gi, fr: 'déjà complété pour ce plan' },
    { en: /already marked as completed/gi, fr: 'déjà marqué comme complété' },
    { en: /active subscription required/gi, fr: 'abonnement actif requis' },
    { en: /subscription required/gi, fr: 'abonnement requis' },
    { en: /access denied/gi, fr: 'accès refusé' },
    { en: /network error/gi, fr: 'erreur réseau' },
    { en: /server error/gi, fr: 'erreur serveur' },
    { en: /timeout/gi, fr: 'délai d\'attente dépassé' },
    { en: /please try again/gi, fr: 'veuillez réessayer' },
    { en: /try again/gi, fr: 'réessayer' },
    { en: /something went wrong/gi, fr: 'quelque chose s\'est mal passé' },
    { en: /an error occurred/gi, fr: 'une erreur s\'est produite' },
    { en: /unable to/gi, fr: 'impossible de' },
    { en: /cannot/gi, fr: 'ne peut pas' },
    { en: /failed to/gi, fr: 'échec de' },
  ];
  
  patterns.forEach(({ en, fr }) => {
    translated = translated.replace(en, fr);
  });
  
  return translated;
};

