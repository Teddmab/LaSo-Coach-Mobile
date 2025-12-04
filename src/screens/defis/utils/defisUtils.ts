export const getBadgeImage = (badgeName?: string): any => {
  const badgeMap: Record<string, any> = {
    'botosi': require('../../../../assets/badge/Badge-Botosi.png'),
    'elengi': require('../../../../assets/badge/Badge-Elengi.png'),
    'makasi': require('../../../../assets/badge/Badge-Makasi.png'),
    'molende': require('../../../../assets/badge/Badge-Molende.png'),
    'mopao': require('../../../../assets/badge/Badge-MOPAO.png'),
    'moto': require('../../../../assets/badge/Badge-MOTO.png'),
    'mpiko': require('../../../../assets/badge/Badge-Mpiko.png'),
    'nzuri': require('../../../../assets/badge/Badge-Nzuri.png'),
    'safi': require('../../../../assets/badge/Badge-Safi.png'),
    'sawa': require('../../../../assets/badge/Badge-SAWA.png'),
  };
  
  const normalizedName = badgeName?.toLowerCase() || '';
  return badgeMap[normalizedName] || null;
};

export const getCategoryIcon = (category?: string): string => {
  const categoryIcons: Record<string, string> = {
    'ACTIVITE_PHYSIQUE': 'barbell',
    'ALIMENTAIRE': 'restaurant',
    'HYDRATATION': 'water',
    'SOCIAL_PARTICIPATION': 'people',
    'fitness': 'barbell',
    'nutrition': 'restaurant',
    'hydration': 'water',
    'sleep': 'moon',
    'mindfulness': 'leaf',
    'default': 'star',
  };
  return categoryIcons[category?.toUpperCase() || ''] || categoryIcons.default;
};

export const formatCategoryText = (category?: string): string => {
  const categoryLabels: Record<string, string> = {
    'ACTIVITE_PHYSIQUE': 'Activité Physique',
    'ALIMENTAIRE': 'Alimentaire',
    'HYDRATATION': 'Hydratation',
    'SOCIAL_PARTICIPATION': 'Participation Sociale',
    'fitness': 'Activité Physique',
    'nutrition': 'Alimentaire',
    'hydration': 'Hydratation',
    'sleep': 'Sommeil',
    'mindfulness': 'Pleine Conscience',
    'default': 'Autre',
  };
  return categoryLabels[category?.toUpperCase() || ''] || categoryLabels.default;
};

export const getValidationIcon = (validationMode?: string): string => {
  const validationIcons: Record<string, string> = {
    'PHOTO': 'camera',
    'TEXT': 'document-text',
    'QUIZ': 'help-circle',
    'COACH': 'person',
    'AUTO_CHECK': 'checkmark-circle',
    'VIDEO': 'videocam',
    'default': 'checkmark-circle',
  };
  return validationIcons[validationMode?.toUpperCase() || ''] || validationIcons.default;
};

