import { User } from '../../../types/auth';

export interface AgendaScreenProps {
  user?: User | null;
  onLogout?: () => void;
  onTabPress?: (tabId: string) => void;
  activeTab?: string;
  onClose?: () => void;
}

export type RendezvousStatus = 'PENDING' | 'ASSIGNED' | 'CONFIRMED' | 'CANCELLED';

export type MeetingProvider = 'GOOGLE_MEET' | 'ZOOM' | 'TEAMS' | 'PHONE';

export interface CoachInfo {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface RendezvousData {
  id?: string;
  scheduledAt: string;
  subject: string;
  duration: number;
  notes?: string;
  status?: RendezvousStatus;
  meetingLink?: string;
  meetingProvider?: MeetingProvider;
  coachName?: string;
  coachEmail?: string;
  assignedCoach?: CoachInfo;
}

export interface RendezvousFormData {
  scheduledAt: string;
  subject: string;
  duration: number;
  notes: string;
}

export interface StatusMeta {
  badge: string;
  badgeColor: string;
  bgColor: string;
  icon: string;
  message: string;
}

export interface ProgramSession {
  id: number;
  title: string;
  date: string;
  time: string;
  day: string;
  points: number;
  image?: string | null;
  canDelete: boolean;
}

