/**
 * Subscription utility functions
 */

/**
 * Get background color for plan based on plan name
 * @param planName - Name of the subscription plan
 * @returns Hex color code
 */
export const getPlanBackgroundColor = (planName: string): string => {
  const name = planName?.toLowerCase() || '';

  if (name.includes('flexy')) {
    return '#4CAF50'; // Green
  } else if (name.includes('premium')) {
    return '#FF9800'; // Orange
  } else if (name.includes('pro')) {
    return '#aece2e'; // Vert/Jaune (remplace le bleu)
  } else if (name.includes('basic')) {
    return '#9E9E9E'; // Grey
  }

  // Default color
  return '#aece2e'; // Vert/Jaune (remplace le bleu)
};

/**
 * Format price with currency
 * @param price - Price amount
 * @param currency - Currency symbol (default: $)
 * @returns Formatted price string
 */
export const formatPrice = (price: number, currency: string = '$'): string => {
  return `${currency}${price.toFixed(2)}`;
};

/**
 * Calculate discount percentage
 * @param originalPrice - Original price
 * @param currentPrice - Current/discounted price
 * @returns Discount percentage
 */
export const calculateDiscount = (originalPrice: number, currentPrice: number): number => {
  if (originalPrice <= currentPrice || originalPrice === 0) {
    return 0;
  }
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

