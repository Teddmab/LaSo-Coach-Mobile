import { User } from '../../../types/auth';

export interface ProgressScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onSubscriptionRenew?: () => void;
  onFAQPress?: () => void;
}

export interface Measurement {
  id?: string;
  weight: number;
  waistSize: number;
  notes?: string;
  createdAt: string;
  isFromPhoto?: boolean; // Flag to identify if measurement came from a progress photo
  photoUrl?: string; // URL de la photo si elle existe
  photoId?: string; // ID de la photo si elle existe
  isInitial?: boolean; // Flag to identify if this is the initial measurement
  date?: string; // Alternative date field
  updatedAt?: string; // Alternative date field
}

export interface InitialMeasurement {
  weight: number;
  waistSize: number;
  date: string;
}

export interface ProgressPhoto {
  id?: string;
  imageUrl?: string;
  url?: string;
  weight?: number;
  notes?: string;
  date?: string;
  createdAt: string;
}

export interface ChartDataPoint {
  date: string;
  weight: number;
  waistSize: number;
  notes?: string;
  isInitial: boolean;
  /** Durée d'activité physique en minutes (pour la courbe Activité), fusionnée depuis l'API activités */
  activityMinutes?: number;
}

/** Entrée activité physique (API user-settings/activities) */
export interface UserActivity {
  id?: string;
  type?: string;
  duration: number;
  date?: string;
  createdAt?: string;
}

export interface ChartYAxisData {
  weightRange: { min: number; max: number };
  waistRange: { min: number; max: number };
  weightLabels: number[];
  waistLabels: number[];
}

export interface MeasurementForm {
  weight: string;
  waistSize: string;
  notes: string;
  error: string;
  saving: boolean;
  selectedPhoto?: any;
  preview?: string | null;
  // Activité physique (optionnel)
  activityType?: string;
  activityDuration?: string;
  activityCalories?: string;
}

export interface PhotoForm {
  weight: string;
  notes: string;
  selectedPhoto: any;
  preview: string | null;
  uploading: boolean;
  error: string;
}

export type ProgressTab = 'measurements' | 'photos';

