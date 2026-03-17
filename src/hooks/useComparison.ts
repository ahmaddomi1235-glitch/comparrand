import { useState, useCallback } from 'react';
import { SEARCH } from '../constants';

export function useComparison() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  const canAdd = selectedIds.length < SEARCH.MAX_COMPARE_ITEMS;

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length >= SEARCH.MAX_COMPARE_ITEMS) {
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setSelectedIds([]), []);

  const add = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id) || prev.length >= SEARCH.MAX_COMPARE_ITEMS) return prev;
      return [...prev, id];
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((i) => i !== id));
  }, []);

  return {
    selectedIds,
    isSelected,
    canAdd,
    toggle,
    clear,
    add,
    remove,
    count: selectedIds.length,
  };
}
