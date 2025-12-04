import { SettingsItem } from '../types';

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
    title: 'Sécurité & Connexion',
    icon: 'shield-checkmark-outline',
    color: '#4CAF50',
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
];

