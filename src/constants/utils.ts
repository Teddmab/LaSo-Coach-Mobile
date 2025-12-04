import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isIOS: boolean = Platform.OS === 'ios';
export const isAndroid: boolean = Platform.OS === 'android';

export const SCREEN_WIDTH: number = width;
export const SCREEN_HEIGHT: number = height;

// Check if device is tablet
export const isTablet: boolean = width >= 768;

// Safe area helpers
export const getStatusBarHeight = (): number => {
  if (isIOS) {
    return height >= 812 ? 44 : 20; // iPhone X and newer vs older
  }
  return 24; // Android default
};

// Common validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // Password requirements from API specification:
  // - Minimum 8 characters
  // - At least 1 uppercase letter (A-Z)
  // - At least 1 lowercase letter (a-z) 
  // - At least 1 number (0-9)
  // - At least 1 special character from: !@#$%^&*(),.?":{}|<>
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  return passwordRegex.test(password);
};

export interface PasswordStrength {
  score: number;
  feedback: string[];
}

/**
 * Get password strength indicator
 */
export const getPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Au moins 8 caractères');
  }

  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins 1 lettre minuscule');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins 1 lettre majuscule');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins 1 chiffre');
  }

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Au moins 1 caractère spécial (!@#$%^&*(),.?":{}|<>)');
  }

  return { score, feedback };
};

// Format helpers
export const formatWeight = (weight: number, unit: string = 'kg'): string => {
  return `${weight} ${unit}`;
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString();
};

// Delay helper for testing
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

