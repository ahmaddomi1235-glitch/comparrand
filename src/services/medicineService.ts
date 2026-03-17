import type { Medicine, SearchFilters } from '../types';
import { medicinesData } from '../data/medicines';
import { searchMedicines } from '../utils';

export const medicineService = {

  getAll(): Medicine[] {
    return medicinesData;
  },

  getById(id: string): Medicine | null {
    if (!id || typeof id !== 'string') return null;
    return medicinesData.find((m) => m.id === id) ?? null;
  },

  search(filters: Partial<SearchFilters>): Medicine[] {
    return searchMedicines(medicinesData, filters);
  },

  getAlternatives(medicineId: string): Medicine[] {
    const medicine = medicinesData.find((m) => m.id === medicineId);
    if (!medicine) return [];
    return medicine.alternatives
      .map((altId) => medicinesData.find((m) => m.id === altId))
      .filter((m): m is Medicine => m !== undefined);
  },

  getByIds(ids: string[]): Medicine[] {
    if (!Array.isArray(ids)) return [];
    return ids
      .map((id) => medicinesData.find((m) => m.id === id))
      .filter((m): m is Medicine => m !== undefined);
  },

  getPopular(limit = 6): Medicine[] {

    return medicinesData
      .filter((m) => !m.requiresPrescription)
      .slice(0, limit);
  },

  getByCategory(category: string, limit?: number): Medicine[] {
    const results = medicinesData.filter((m) => m.category === category);
    return limit ? results.slice(0, limit) : results;
  },

  getCompanies(): string[] {
    const companies = new Set(medicinesData.map((m) => m.company));
    return Array.from(companies).sort();
  },
};

export default medicineService;
