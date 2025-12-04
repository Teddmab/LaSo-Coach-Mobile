export const getBadgeImage = (badgeName?: string): any => {
  const badgeMap: Record<string, any> = {
    'botosi': require('../../../../assets/badge/Badge-Botosi.png'),
    'elengi': require('../../../../assets/badge/Badge-Elengi.png'),
    'makasi': require('../../../../assets/badge/Badge-Makasi.png'),
    'molende': require('../../../../assets/badge/Badge-Molende.png'),
    'mopao': require('../../../../assets/badge/Badge-MOPAO.png'),
    'moto': require('../../../../assets/badge/Badge-MOTO.png'),
    'mpiko': require('../../../../assets/badge/Badge-Mpiko.png'),
    'nzuri': require('../../../../assets/badge/Badge-Nzuri.png'),
    'safi': require('../../../../assets/badge/Badge-Safi.png'),
    'sawa': require('../../../../assets/badge/Badge-SAWA.png'),
  };
  
  const normalizedName = badgeName?.toLowerCase() || '';
  return badgeMap[normalizedName] || null;
};

export const countryCodeToFlagEmoji = (countryCode?: string): string => {
  if (!countryCode || countryCode.length !== 2) return '🏳️';
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  
  return String.fromCodePoint(...codePoints);
};

export const formatPoints = (points: number): string => {
  if (!points) return '0';
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
};

