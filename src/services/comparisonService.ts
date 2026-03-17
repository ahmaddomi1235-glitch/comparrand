import type { Medicine, ComparisonResult } from '../types';
import { LOCAL_STORAGE_KEYS } from '../types';
import { safeGetItem, safeSetItem, getMatchLevel } from '../utils';
import { SEARCH } from '../constants';

export const comparisonService = {

  compare(medicines: Medicine[]): ComparisonResult {
    if (!medicines || medicines.length < 2) {
      return {
        medicines,
        summary: 'يجب اختيار دواءين على الأقل للمقارنة.',
        cheapestId: null,
        bestMatchId: null,
        warnings: [],
      };
    }

    const cheapest = medicines.reduce((prev, curr) =>
      curr.price < prev.price ? curr : prev
    );

    const base = medicines[0];
    let bestMatch: Medicine | null = null;
    let bestMatchScore = -1;

    for (let i = 1; i < medicines.length; i++) {
      const match = getMatchLevel(base, medicines[i]);
      const scores = { exact: 3, close: 2, partial: 1, different: 0 };
      if (scores[match.level] > bestMatchScore) {
        bestMatchScore = scores[match.level];
        bestMatch = medicines[i];
      }
    }

    const warnings: string[] = [];
    const hasDifferentActiveIngredient = medicines.some(
      (m) => m.activeIngredient !== base.activeIngredient
    );
    if (hasDifferentActiveIngredient) {
      warnings.push('بعض الأدوية تحتوي على مواد فعالة مختلفة — لا تستبدلها دون استشارة صيدلي أو طبيب.');
    }

    const hasPrescriptionDrug = medicines.some((m) => m.requiresPrescription);
    if (hasPrescriptionDrug) {
      warnings.push('بعض الأدوية المقارنة تستلزم وصفة طبية.');
    }

    const highWarnings = medicines.filter((m) =>
      m.warnings.some((w) => w.level === 'danger')
    );
    if (highWarnings.length > 0) {
      warnings.push(
        `${highWarnings.map((m) => m.tradeName).join(' و ')} تحتوي على تحذيرات طبية مهمة — راجع تفاصيل كل دواء.`
      );
    }

    const summary =
      medicines.length === 2
        ? `مقارنة بين ${medicines[0].tradeName} و ${medicines[1].tradeName}`
        : `مقارنة بين ${medicines.length} أدوية`;

    return {
      medicines,
      summary,
      cheapestId: cheapest.id,
      bestMatchId: bestMatch?.id ?? null,
      warnings,
    };
  },

  saveComparison(medicineIds: string[]): void {
    if (!Array.isArray(medicineIds) || medicineIds.length < 2) return;
    const existing = safeGetItem<string[][]>(LOCAL_STORAGE_KEYS.RECENT_COMPARISONS, []);
    const updated = [medicineIds, ...existing.filter((c) => c.join(',') !== medicineIds.join(','))].slice(0, 5);
    safeSetItem(LOCAL_STORAGE_KEYS.RECENT_COMPARISONS, updated);
  },

  getRecentComparisons(): string[][] {
    return safeGetItem<string[][]>(LOCAL_STORAGE_KEYS.RECENT_COMPARISONS, []);
  },

  validateIds(ids: string[]): boolean {
    if (!Array.isArray(ids)) return false;
    if (ids.length < 2 || ids.length > SEARCH.MAX_COMPARE_ITEMS) return false;
    if (ids.some((id) => typeof id !== 'string' || id.trim() === '')) return false;
    return true;
  },
};

export default comparisonService;
