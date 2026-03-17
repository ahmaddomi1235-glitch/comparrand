import type { Medicine, SearchFilters } from '../types';
import { IMAGE_UPLOAD, SEARCH } from '../constants';

export function safeGetItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {

  }
}

export function normalizeArabic(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ؤو]/g, 'و')
    .replace(/[ئيى]/g, 'ي')
    .replace(/ة/g, 'ه');
}

export function sanitizeInput(input: string): string {
  return String(input)
    .replace(/[<>'"]/g, '') // strip potentially dangerous chars
    .trim()
    .slice(0, SEARCH.MAX_QUERY_LENGTH);
}

/**
 * Format price in Jordanian Dinar (JOD)
 */
export function formatPrice(price: number): string {
  return `${price.toFixed(3)} د.أ`;
}

/**
 * Format price as JOD numeric only (for machine use)
 */
export function formatPriceJOD(price: number): string {
  return `JOD ${price.toFixed(3)}`;
}

/**
 * Calculate price difference
 */
export function priceDiff(a: number, b: number): string {
  const diff = a - b;
  if (diff === 0) return 'نفس السعر';
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(2)} ر.س`;
}

/**
 * Calculate percentage difference
 */
export function priceDiffPercent(base: number, compare: number): string {
  if (base === 0) return '0%';
  const percent = ((compare - base) / base) * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

// ===========================
// Search utilities
// ===========================

export function searchMedicines(
  medicines: Medicine[],
  filters: Partial<SearchFilters>
): Medicine[] {
  const query = filters.query ? normalizeArabic(sanitizeInput(filters.query)) : '';

  return medicines.filter((med) => {
    // Text search across multiple fields
    if (query && query.length >= SEARCH.MIN_QUERY_LENGTH) {
      const searchableText = normalizeArabic(
        [
          med.tradeName,
          med.activeIngredient,
          med.company,
          med.dosageForm,
          med.category,
          ...med.tags,
        ].join(' ')
      );
      if (!searchableText.includes(query)) return false;
    }

    // Category filter
    if (filters.category && med.category !== filters.category) return false;

    // Dosage form filter
    if (filters.dosageForm && med.dosageForm !== filters.dosageForm) return false;

    // Company filter
    if (filters.company) {
      const companyNorm = normalizeArabic(filters.company);
      if (!normalizeArabic(med.company).includes(companyNorm)) return false;
    }

    // Price range filter
    if (filters.minPrice !== '' && filters.minPrice !== undefined && med.price < filters.minPrice) return false;
    if (filters.maxPrice !== '' && filters.maxPrice !== undefined && med.price > filters.maxPrice) return false;

    // Prescription filter
    if (filters.requiresPrescription !== '' && filters.requiresPrescription !== undefined) {
      if (med.requiresPrescription !== filters.requiresPrescription) return false;
    }

    return true;
  });
}

// ===========================
// Comparison utilities
// ===========================

export function getMatchLevel(
  med1: Medicine,
  med2: Medicine
): { level: 'exact' | 'close' | 'partial' | 'different'; label: string } {
  if (
    normalizeArabic(med1.activeIngredient) === normalizeArabic(med2.activeIngredient) &&
    med1.concentration === med2.concentration &&
    med1.dosageForm === med2.dosageForm
  ) {
    return { level: 'exact', label: 'تطابق كامل' };
  }
  if (normalizeArabic(med1.activeIngredient) === normalizeArabic(med2.activeIngredient)) {
    if (med1.concentration === med2.concentration) {
      return { level: 'close', label: 'تطابق قريب' };
    }
    return { level: 'partial', label: 'تطابق جزئي' };
  }
  return { level: 'different', label: 'مادة مختلفة' };
}

// ===========================
// Image validation utilities
// ===========================

export function validateImageFile(file: File): { valid: boolean; error: string | null } {
  if (!IMAGE_UPLOAD.ALLOWED_TYPES.includes(file.type as typeof IMAGE_UPLOAD.ALLOWED_TYPES[number])) {
    return {
      valid: false,
      error: `نوع الملف غير مدعوم. يُسمح فقط بـ: ${IMAGE_UPLOAD.ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  if (file.size > IMAGE_UPLOAD.MAX_SIZE_BYTES) {
    return {
      valid: false,
      error: `حجم الملف يتجاوز الحد المسموح (${IMAGE_UPLOAD.MAX_SIZE_LABEL})`,
    };
  }

  return { valid: true, error: null };
}

// ===========================
// Date utilities
// ===========================

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'تاريخ غير صحيح';
  }
}

// ===========================
// ID utilities
// ===========================

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ===========================
// Text sanitization for display
// ===========================

/**
 * Ensure extracted text from AI analysis is safe to display
 */
export function sanitizeExtractedText(text: unknown): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, 200); // max 200 chars for any extracted field
}
