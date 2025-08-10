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
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
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