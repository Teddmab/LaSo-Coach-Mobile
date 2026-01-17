/**
 * Mobile Money Payment Configuration
 * 
 * Configuration for mobile money payments across African countries
 * Supporting providers: Airtel Money, Vodacom M-Pesa, Orange Money
 */

export interface MobileMoneyProvider {
  code: string;
  label: string;
  icon?: string;
}

export interface MobileMoneyCountry {
  code: string;
  name: string;
  phonePrefix: string;
  flag: string;
  currency: string[];
  providers: MobileMoneyProvider[];
}

/**
 * Supported countries and their mobile money providers
 */
export const MOBILE_MONEY_COUNTRIES: MobileMoneyCountry[] = [
  {
    code: 'COD',
    name: 'Congo (RDC)',
    phonePrefix: '+243',
    flag: '🇨🇩',
    currency: ['USD', 'CDF'],
    providers: [
      {
        code: 'AIRTEL_COD',
        label: 'Airtel Money',
      },
      {
        code: 'VODACOM_MPESA_COD',
        label: 'Vodacom M-Pesa',
      },
      {
        code: 'ORANGE_COD',
        label: 'Orange Money',
      },
    ],
  },
  // Add more countries here as needed
];

/**
 * Get country by code
 */
export const getCountryByCode = (code: string): MobileMoneyCountry | undefined => {
  return MOBILE_MONEY_COUNTRIES.find(country => country.code === code);
};

/**
 * Get provider by code
 */
export const getProviderByCode = (
  countryCode: string,
  providerCode: string
): MobileMoneyProvider | undefined => {
  const country = getCountryByCode(countryCode);
  return country?.providers.find(provider => provider.code === providerCode);
};

/**
 * Get all provider names for a country (for UI display)
 */
export const getProviderNames = (countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return '';
  return country.providers.map(p => p.label.replace(' Money', '').replace(' M-Pesa', '')).join(' / ');
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (phoneNumber: string, countryCode: string): boolean => {
  const country = getCountryByCode(countryCode);
  if (!country) return false;
  
  // Remove all spaces and dashes
  const cleanPhone = phoneNumber.replace(/[\s-]/g, '');
  
  // Should start with country prefix (with or without +)
  const prefixWithoutPlus = country.phonePrefix.replace('+', '');
  const hasPrefix = cleanPhone.startsWith(country.phonePrefix) || cleanPhone.startsWith(prefixWithoutPlus);
  
  // Should have reasonable length (typically 9-15 digits including prefix)
  const hasValidLength = cleanPhone.length >= 9 && cleanPhone.length <= 15;
  
  return hasPrefix && hasValidLength;
};

/**
 * Format phone number with country prefix
 */
export const formatPhoneNumber = (phoneNumber: string, countryCode: string): string => {
  const country = getCountryByCode(countryCode);
  if (!country) return phoneNumber;
  
  // Remove all non-digits
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  
  // If already has prefix, return with +
  const prefixWithoutPlus = country.phonePrefix.replace('+', '');
  if (cleanPhone.startsWith(prefixWithoutPlus)) {
    return `+${cleanPhone}`;
  }
  
  // Otherwise add prefix
  return `${country.phonePrefix}${cleanPhone}`;
};
