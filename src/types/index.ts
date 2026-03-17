export type DosageForm =
  | 'أقراص'
  | 'كبسولات'
  | 'شراب'
  | 'حقن'
  | 'مرهم'
  | 'قطرات'
  | 'بخاخ'
  | 'تحاميل'
  | 'أمبولات'
  | 'محلول'
  | 'جل'
  | 'أقراص فوّارة'
  | 'كريم';

export type MedicineCategory =
  | 'مسكنات ومضادات التهاب'
  | 'مضادات حيوية'
  | 'ضغط الدم'
  | 'السكري'
  | 'الجهاز الهضمي'
  | 'الجهاز التنفسي'
  | 'القلب والأوعية'
  | 'الجهاز العصبي'
  | 'الغدد والهرمونات'
  | 'الجلد'
  | 'العيون'
  | 'فيتامينات ومكملات';

export type WarningLevel = 'none' | 'info' | 'warning' | 'danger';

export interface MedicineWarning {
  level: WarningLevel;
  title: string;
  message: string;
}

export interface Medicine {
  id: string;
  tradeName: string;
  activeIngredient: string;
  concentration: string;
  dosageForm: DosageForm;
  company: string;
  price: number;
  category: MedicineCategory;
  description: string;
  indications: string[];
  warnings: MedicineWarning[];
  alternatives: string[];
  tags: string[];
  requiresPrescription: boolean;
  imageUrl?: string;
}

export type MatchLevel = 'exact' | 'close' | 'partial' | 'different';

export interface ComparisonResult {
  medicines: Medicine[];
  summary: string;
  cheapestId: string | null;
  bestMatchId: string | null;
  warnings: string[];
}

export interface SearchFilters {
  query: string;
  category: MedicineCategory | '';
  dosageForm: DosageForm | '';
  company: string;
  minPrice: number | '';
  maxPrice: number | '';
  requiresPrescription: boolean | '';
}

export interface SearchResult {
  medicines: Medicine[];
  total: number;
  query: string;
}

export interface FavoriteItem {
  medicineId: string;
  addedAt: string;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ImageAnalysisResult {
  extractedMedicineName: string | null;
  extractedActiveIngredient: string | null;
  extractedConcentration: string | null;
  confidence: number;
  rawText: string;
  notes: string;
}

export interface ImageAnalysisState {
  status: AnalysisStatus;
  result: ImageAnalysisResult | null;
  error: string | null;
  previewUrl: string | null;
}

export interface AdminStats {
  totalMedicines: number;
  totalAlternatives: number;
  analyzedImages: number;
  savedComparisons: number;
}

export interface AdminImageReview {
  id: string;
  fileName: string;
  analyzedAt: string;
  result: ImageAnalysisResult | null;
  status: 'pending' | 'reviewed' | 'flagged';
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export const LOCAL_STORAGE_KEYS = {
  FAVORITES: 'qaren_favorites',
  RECENT_SEARCHES: 'qaren_recent_searches',
  RECENT_COMPARISONS: 'qaren_recent_comparisons',
  DARK_MODE: 'qaren_dark_mode',
  ANALYZED_IMAGES: 'qaren_analyzed_images',
} as const;

export type LocalStorageKey = typeof LOCAL_STORAGE_KEYS[keyof typeof LOCAL_STORAGE_KEYS];
