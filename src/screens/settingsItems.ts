import { SettingsItem } from './settings/types';

export const SETTINGS_ITEMS: SettingsItem[] = [
  {
    id: 'profile',
    title: 'Profile',
    icon: 'person-outline',
    color: '#4CAF50',
    expandable: true,
    subItems: [
      { id: 'mon-profile', title: 'Mon Profile' },
      { id: 'mes-objectifs', title: 'Mes Objectifs' },
      { id: 'recommandations', title: 'Recommandations' },
      { id: 'rendez-vous', title: 'Rendez-vous' },
      { id: 'confirmation', title: 'Confirmation' },
    ],
  },
  {
    id: 'security',
    title: 'Confidentialité & Termes',
    icon: 'shield-checkmark-outline',
    color: '#4CAF50',
    expandable: true,
    subItems: [
      { id: 'privacy-policy', title: 'Politique de confidentialité' },
      { id: 'terms-of-service', title: 'Termes de service' },
      { id: 'platform-rules', title: 'Règles de la plateforme' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: 'notifications-outline',
    color: '#4CAF50',
  },
  {
    id: 'language',
    title: 'Langue & Région',
    icon: 'language-outline',
    color: '#4CAF50',
  },
  {
    id: 'subscription',
    title: 'Abonnement & Paiement',
    icon: 'card-outline',
    color: '#4CAF50',
  },
  {
    id: 'contact-support',
    title: 'Contact Support',
    icon: 'help-circle-outline',
    color: '#4CAF50',
  },
  {
    id: 'about',
    title: 'À propos de l\'application',
    icon: 'information-circle-outline',
    color: '#4CAF50',
  },
];

