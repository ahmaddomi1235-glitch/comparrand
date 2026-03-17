import { LOCAL_STORAGE_KEYS } from '../types';
import { safeGetItem, safeSetItem, sanitizeInput } from '../utils';
import { SEARCH } from '../constants';

export const searchHistoryService = {

  getAll(): string[] {
    return safeGetItem<string[]>(LOCAL_STORAGE_KEYS.RECENT_SEARCHES, []);
  },

  add(query: string): void {
    const clean = sanitizeInput(query);
    if (!clean || clean.length < 2) return;
    const existing = this.getAll();
    const updated = [clean, ...existing.filter((q) => q !== clean)].slice(
      0,
      SEARCH.MAX_RECENT_SEARCHES
    );
    safeSetItem(LOCAL_STORAGE_KEYS.RECENT_SEARCHES, updated);
  },

  remove(query: string): void {
    const existing = this.getAll();
    safeSetItem(
      LOCAL_STORAGE_KEYS.RECENT_SEARCHES,
      existing.filter((q) => q !== query)
    );
  },

  clearAll(): void {
    safeSetItem(LOCAL_STORAGE_KEYS.RECENT_SEARCHES, []);
  },
};

export default searchHistoryService;
