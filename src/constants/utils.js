import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Check if device is tablet
export const isTablet = width >= 768;

// Safe area helpers
export const getStatusBarHeight = () => {
  if (isIOS) {
    return height >= 812 ? 44 : 20; // iPhone X and newer vs older
  }
  return 24; // Android default
};

// Common validation functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  // Password requirements from API specification:
  // - Minimum 8 characters
  // - At least 1 uppercase letter (A-Z)
  // - At least 1 lowercase letter (a-z) 
  // - At least 1 number (0-9)
  // - At least 1 special character from: !@#$%^&*(),.?":{}|<>
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[a-zA-Z\d!@#$%^&*(),.?":{}|<>]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Get password strength indicator
 * @param {string} password 
 * @returns {{score: number, feedback: string[]}} Password strength score (0-4) and feedback
 */
export const getPasswordStrength = (password) => {
  const feedback = [];
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
export const formatWeight = (weight, unit = 'kg') => {
  return `${weight} ${unit}`;
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString();
};

// Delay helper for testing
export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); 