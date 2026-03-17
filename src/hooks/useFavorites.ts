import { useState, useEffect, useCallback } from 'react';
import { favoritesService } from '../services/favoritesService';

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() =>
    favoritesService.getFavoriteIds()
  );

  const refresh = useCallback(() => {
    setFavoriteIds(favoritesService.getFavoriteIds());
  }, []);

  const isFavorite = useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds]
  );

  const toggle = useCallback(
    (id: string) => {
      favoritesService.toggle(id);
      refresh();
    },
    [refresh]
  );

  const add = useCallback(
    (id: string) => {
      favoritesService.add(id);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      favoritesService.remove(id);
      refresh();
    },
    [refresh]
  );

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'qaren_favorites') {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [refresh]);

  return { favoriteIds, isFavorite, toggle, add, remove };
}
