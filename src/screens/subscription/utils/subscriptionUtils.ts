import { Invoice } from '../types';

export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  } catch (error) {
    return '-';
  }
};

export const getStatusBadgeStyle = (status?: string) => {
  const upperStatus = (status || '').toUpperCase();
  if (upperStatus === 'ACTIVE' || upperStatus === 'ACTIF') {
    return { backgroundColor: '#C8E6C9' };
  } else if (upperStatus === 'EXPIRED' || upperStatus === 'EXPIRÉ') {
    return { backgroundColor: '#FFCDD2' };
  }
  return { backgroundColor: '#E0E0E0' };
};

export const getStatusTextColor = (status?: string): string => {
  const upperStatus = (status || '').toUpperCase();
  if (upperStatus === 'ACTIVE' || upperStatus === 'ACTIF') {
    return '#2E7D32';
  } else if (upperStatus === 'EXPIRED' || upperStatus === 'EXPIRÉ') {
    return '#C62828';
  }
  return '#424242';
};

export const calculateBillingPeriod = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return 'Mensuelle';
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      return 'Hebdomadaire';
    } else if (diffDays <= 31) {
      return 'Mensuelle';
    } else if (diffDays <= 93) {
      return 'Trimestrielle';
    } else if (diffDays <= 186) {
      return 'Semestrielle';
    } else {
      return 'Annuelle';
    }
  } catch (error) {
    console.error('Error calculating billing period:', error);
    return 'Mensuelle';
  }
};

export const getLatestActiveSubscription = (invoices: Invoice[]): Invoice | null => {
  if (!invoices || invoices.length === 0) {
    return null;
  }

  const activeSubscriptions = invoices.filter(inv => {
    const status = (inv.status || inv.subscriptionStatus || '').toUpperCase();
    return status === 'ACTIVE' || status === 'ACTIF';
  });

  if (activeSubscriptions.length === 0) {
    return null;
  }

  activeSubscriptions.sort((a, b) => {
    const dateA = new Date(a.startDate || a.createdAt || a.beginDate || 0).getTime();
    const dateB = new Date(b.startDate || b.createdAt || b.beginDate || 0).getTime();
    return dateB - dateA;
  });

  return activeSubscriptions[0];
};

export const getPlanBackgroundColor = (planName: string): string => {
  const name = planName.toLowerCase();
  if (name.includes('premium')) {
    return '#8B5CF6';
  } else if (name.includes('flexy')) {
    return '#FF6B35';
  } else if (name.includes('basic')) {
    return '#2196F3';
  }
  return '#4CAF50';
};

