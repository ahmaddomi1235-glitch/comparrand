export const APP_NAME = 'قارن دواءك';
export const APP_TAGLINE = 'منصة صيدلانية رقمية للمقارنة والتوعية — السوق الأردني';
export const APP_OWNER = 'RAND YAISH';
export const APP_DEVELOPER = 'Ahmad Domi';
export const APP_MARKET = 'الأردن';
export const APP_CURRENCY_SYMBOL = 'د.أ';
export const APP_CURRENCY_CODE = 'JOD';

export const ROUTES = {
  HOME: '/',
  SEARCH: '/search',
  SEARCH_RESULTS: '/results',
  MEDICINE_DETAIL: '/medicine/:id',
  COMPARE: '/compare',
  ALTERNATIVES: '/alternatives/:id',
  IMAGE_ANALYSIS: '/analysis',
  FAVORITES: '/favorites',
  FAQ: '/faq',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  NOT_FOUND: '/404',
} as const;

export const COLORS = {
  primary: '#4C9A7D',
  primaryHover: '#3F846A',
  primaryLight: '#EDF6F0',
  secondary: '#A8D5BA',
  bgPage: '#F7F6F2',
  bgSurface: '#FFFDF9',
  borderDefault: '#D8E2DA',
  borderLight: '#E6ECE7',
  textMain: '#2F3A34',
  textSecondary: '#6B7C73',
  successBg: '#E4F3E8',
  successText: '#3D7E58',
  warningBg: '#F9EFCF',
  warningText: '#9A7423',
  dangerBg: '#F5DDDD',
  dangerText: '#9A4B4B',
  infoBg: '#DCEFE3',
  infoText: '#3E6B55',
} as const;

export const IMAGE_UPLOAD = {
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_SIZE_LABEL: '5 ميغابايت',
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const,
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'] as const,
} as const;

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_QUERY_LENGTH: 100,
  MAX_RECENT_SEARCHES: 10,
  MAX_COMPARE_ITEMS: 4,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 12,
} as const;

export const DOSAGE_FORMS = [
  'أقراص',
  'كبسولات',
  'شراب',
  'حقن',
  'مرهم',
  'قطرات',
  'بخاخ',
  'تحاميل',
  'أمبولات',
  'محلول',
  'جل',
  'أقراص فوّارة',
  'كريم',
] as const;

export const MEDICINE_CATEGORIES = [
  'مسكنات ومضادات التهاب',
  'مضادات حيوية',
  'ضغط الدم',
  'السكري',
  'الجهاز الهضمي',
  'الجهاز التنفسي',
  'القلب والأوعية',
  'الجهاز العصبي',
  'الغدد والهرمونات',
  'الجلد',
  'العيون',
  'فيتامينات ومكملات',
] as const;
