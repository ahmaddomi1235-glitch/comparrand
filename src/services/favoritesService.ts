import type { FavoriteItem } from '../types';
import { LOCAL_STORAGE_KEYS } from '../types';
import { safeGetItem, safeSetItem } from '../utils';

export const favoritesService = {

  getAll(): FavoriteItem[] {
    return safeGetItem<FavoriteItem[]>(LOCAL_STORAGE_KEYS.FAVORITES, []);
  },

  getFavoriteIds(): string[] {
    const items = this.getAll();
    return items.map((item) => item.medicineId);
  },

  isFavorite(medicineId: string): boolean {
    const items = this.getAll();
    return items.some((item) => item.medicineId === medicineId);
  },

  add(medicineId: string): boolean {
    if (!medicineId || typeof medicineId !== 'string') return false;
    const items = this.getAll();
    if (items.some((item) => item.medicineId === medicineId)) return true;
    const newItems: FavoriteItem[] = [
      ...items,
      { medicineId, addedAt: new Date().toISOString() },
    ];
    return safeSetItem(LOCAL_STORAGE_KEYS.FAVORITES, newItems);
  },

  remove(medicineId: string): boolean {
    const items = this.getAll();
    const filtered = items.filter((item) => item.medicineId !== medicineId);
    return safeSetItem(LOCAL_STORAGE_KEYS.FAVORITES, filtered);
  },

  toggle(medicineId: string): boolean {
    if (this.isFavorite(medicineId)) {
      this.remove(medicineId);
      return false;
    } else {
      this.add(medicineId);
      return true;
    }
  },

  clearAll(): void {
    safeSetItem(LOCAL_STORAGE_KEYS.FAVORITES, []);
  },
};

export default favoritesService;
