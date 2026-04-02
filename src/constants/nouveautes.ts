/**
 * Clés AsyncStorage et contenu des bottomsheets "Nouveautés" par écran.
 * Une clé par écran (suffixée par userId) pour afficher une seule fois par utilisateur.
 */

export const NOUVEAUTES_STORAGE_KEY_PREFIX = '@laso_nouveautes';

export type NouveauteStep = {
  title: string;
  description: string;
  icon?: string; // nom Ionicons
};

export type NouveautesScreenId = 'home' | 'agora' | 'nutrition' | 'progress' | 'defis' | 'achievements';

export function getNouveautesStorageKey(screenId: NouveautesScreenId, userId: string): string {
  return `${NOUVEAUTES_STORAGE_KEY_PREFIX}_${screenId}_${userId}`;
}

/** Contenu par écran (étapes). À faire évoluer par version si besoin. */
export const NOUVEAUTES_STEPS: Record<NouveautesScreenId, NouveauteStep[]> = {
  home: [
    {
      title: 'Nouvelle carte des plats',
      description: '', // texte détaillé rendu dans le variant home avec sous-icônes
      icon: 'restaurant-outline',
    },
  ],
  agora: [
    {
      title: 'Liker et signaler',
      description: '', // rendu dans le variant agora avec sous-icônes
      icon: 'heart-outline',
    },
  ],
  nutrition: [
    {
      title: 'Complétion des plats',
      description: '', // rendu dans le variant nutrition avec sous-icônes
      icon: 'checkmark-done-outline',
    },
  ],
  progress: [
    {
      title: 'Suivi statistique',
      description: '', // rendu dans le variant progress avec sous-icônes
      icon: 'stats-chart-outline',
    },
  ],
  defis: [
    {
      title: 'Badges et récompenses',
      description:
        'Débloquez des badges progressivement et gagnez des récompenses en relevant les défis.',
      icon: 'medal-outline',
    },
  ],
  achievements: [
    {
      title: 'Classement et réalisations',
      description: '', // rendu dans le variant achievements avec sous-icônes
      icon: 'trophy-outline',
    },
  ],
};
