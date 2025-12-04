import { User } from '../../../types/auth';

export interface ProfileScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: () => void;
  initialStep?: number;
  navigation?: any;
  onFAQPress?: () => void;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  country: string;
  height: string;
  initialWeight: string;
  initialWaist: string;
  gender: string;
  occupation: string;
  targetWeight: string;
  targetWaist: string;
  generalObjective: string;
  specificObjectives: string[];
  dietaryRestrictions: string[];
  acceptedTerms: boolean;
  photoConsent: boolean;
  appointmentDate: string;
  appointmentDuration: string;
  appointmentSubject: string;
  appointmentNotes: string;
}

export interface ExpandedSections {
  dailyInstructions: boolean;
  mandatoryRequirements: boolean;
  otherRecommendations: boolean;
}

export interface SubscriptionData {
  status?: string;
  isExpired?: boolean;
  requiresRenewal?: boolean;
}

export interface RendezvousData {
  id?: string;
  scheduledAt?: string;
  duration?: number;
  subject?: string;
  notes?: string;
  status?: string;
}

export interface MeasurementsData {
  [key: string]: any;
}

export interface ProgressData {
  completedSteps?: string[];
  currentStep?: string;
}

