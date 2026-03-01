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

// Add country name to country code mapping
const countryNameToCode: { [key: string]: string } = {
  'afghanistan': 'AF', 'albania': 'AL', 'algeria': 'DZ', 'algérie': 'DZ', 'andorra': 'AD', 'angola': 'AO',
  'antigua and barbuda': 'AG', 'argentina': 'AR', 'armenia': 'AM', 'australia': 'AU',
  'austria': 'AT', 'azerbaijan': 'AZ', 'azerbaïdjan': 'AZ', 'bahamas': 'BS', 'bahrain': 'BH',
  'bangladesh': 'BD', 'barbados': 'BB', 'belarus': 'BY', 'belgium': 'BE', 'belize': 'BZ',
  'benin': 'BJ', 'bhutan': 'BT', 'bolivia': 'BO', 'bosnia and herzegovina': 'BA',
  'botswana': 'BW', 'brazil': 'BR', 'brunei': 'BN', 'bulgaria': 'BG', 'burkina faso': 'BF',
  'burundi': 'BI', 'cambodia': 'KH', 'cameroon': 'CM', 'canada': 'CA', 'cape verde': 'CV',
  'central african republic': 'CF', 'chad': 'TD', 'chile': 'CL', 'china': 'CN',
  'colombia': 'CO', 'comoros': 'KM', 'congo': 'CG', 'costa rica': 'CR', 'croatia': 'HR',
  'cuba': 'CU', 'cyprus': 'CY', 'czech republic': 'CZ', 'czechia': 'CZ', 'denmark': 'DK',
  'djibouti': 'DJ', 'dominica': 'DM', 'dominican republic': 'DO', 'ecuador': 'EC',
  'egypt': 'EG', 'el salvador': 'SV', 'equatorial guinea': 'GQ', 'eritrea': 'ER',
  'estonia': 'EE', 'eswatini': 'SZ', 'ethiopia': 'ET', 'fiji': 'FJ', 'finland': 'FI',
  'france': 'FR', 'gabon': 'GA', 'gambia': 'GM', 'georgia': 'GE', 'germany': 'DE',
  'ghana': 'GH', 'greece': 'GR', 'grenada': 'GD', 'guatemala': 'GT', 'guinea': 'GN',
  'guinea-bissau': 'GW', 'guyana': 'GY', 'haiti': 'HT', 'honduras': 'HN', 'hungary': 'HU',
  'iceland': 'IS', 'india': 'IN', 'indonesia': 'ID', 'iran': 'IR', 'iraq': 'IQ',
  'ireland': 'IE', 'israel': 'IL', 'italy': 'IT', 'ivory coast': 'CI', 'jamaica': 'JM',
  'japan': 'JP', 'jordan': 'JO', 'kazakhstan': 'KZ', 'kenya': 'KE', 'kiribati': 'KI',
  'kuwait': 'KW', 'kyrgyzstan': 'KG', 'laos': 'LA', 'latvia': 'LV', 'lebanon': 'LB',
  'lesotho': 'LS', 'liberia': 'LR', 'libya': 'LY', 'liechtenstein': 'LI', 'lithuania': 'LT',
  'luxembourg': 'LU', 'madagascar': 'MG', 'malawi': 'MW', 'malaysia': 'MY', 'maldives': 'MV',
  'mali': 'ML', 'malta': 'MT', 'marshall islands': 'MH', 'mauritania': 'MR', 'mauritius': 'MU',
  'mexico': 'MX', 'micronesia': 'FM', 'moldova': 'MD', 'monaco': 'MC', 'mongolia': 'MN',
  'montenegro': 'ME', 'morocco': 'MA', 'mozambique': 'MZ', 'myanmar': 'MM', 'namibia': 'NA',
  'nauru': 'NR', 'nepal': 'NP', 'netherlands': 'NL', 'new zealand': 'NZ', 'nicaragua': 'NI',
  'niger': 'NE', 'nigeria': 'NG', 'north korea': 'KP', 'north macedonia': 'MK', 'norway': 'NO',
  'oman': 'OM', 'pakistan': 'PK', 'palau': 'PW', 'panama': 'PA', 'papua new guinea': 'PG',
  'paraguay': 'PY', 'peru': 'PE', 'philippines': 'PH', 'poland': 'PL', 'portugal': 'PT',
  'qatar': 'QA', 'romania': 'RO', 'russia': 'RU', 'rwanda': 'RW', 'saint kitts and nevis': 'KN',
  'saint lucia': 'LC', 'saint vincent and the grenadines': 'VC', 'samoa': 'WS',
  'san marino': 'SM', 'sao tome and principe': 'ST', 'saudi arabia': 'SA', 'senegal': 'SN',
  'serbia': 'RS', 'seychelles': 'SC', 'sierra leone': 'SL', 'singapore': 'SG', 'slovakia': 'SK',
  'slovenia': 'SI', 'solomon islands': 'SB', 'somalia': 'SO', 'south africa': 'ZA',
  'south korea': 'KR', 'south sudan': 'SS', 'spain': 'ES', 'sri lanka': 'LK', 'sudan': 'SD',
  'suriname': 'SR', 'sweden': 'SE', 'switzerland': 'CH', 'syria': 'SY', 'taiwan': 'TW',
  'tajikistan': 'TJ', 'tanzania': 'TZ', 'thailand': 'TH', 'timor-leste': 'TL', 'togo': 'TG',
  'tonga': 'TO', 'trinidad and tobago': 'TT', 'tunisia': 'TN', 'turkey': 'TR', 'turkmenistan': 'TM',
  'tuvalu': 'TV', 'uganda': 'UG', 'ukraine': 'UA', 'united arab emirates': 'AE', 'united kingdom': 'GB',
  'united states': 'US', 'uruguay': 'UY', 'uzbekistan': 'UZ', 'vanuatu': 'VU', 'vatican city': 'VA',
  'venezuela': 'VE', 'vietnam': 'VN', 'yemen': 'YE', 'zambia': 'ZM', 'zimbabwe': 'ZW',
  'democratic republic of the congo': 'CD', 'congo (kinshasa)': 'CD', 'congo (brazzaville)': 'CG',
  'kinshasa': 'CD', 'brazzaville': 'CG', 'république démocratique du congo': 'CD', 'rdc': 'CD'
};

// Helper function to extract country code from address string
export const extractCountryFromAddress = (address: string): string | null => {
  if (!address) return null;
  
  // If address is already a 2-letter code, return it
  if (address.length === 2 && /^[A-Z]{2}$/i.test(address)) {
    return address.toUpperCase();
  }
  
  // Split by semicolon and get the last part (country)
  const parts = address.split(';').map(part => part.trim());
  const country = parts[parts.length - 1];
  
  if (!country) return null;
  
  // Convert to lowercase for matching
  const countryLower = country.toLowerCase();
  
  // Try exact match first
  if (countryNameToCode[countryLower]) {
    return countryNameToCode[countryLower];
  }
  
  // Try partial matches
  for (const [name, code] of Object.entries(countryNameToCode)) {
    if (name.includes(countryLower) || countryLower.includes(name)) {
      return code;
    }
  }
  
  return null;
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

