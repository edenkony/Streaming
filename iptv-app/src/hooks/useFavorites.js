import { useState, useCallback } from 'react';

const STORAGE_KEY = 'iptv_favorites';

function load() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function save(set) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => load());

  const toggle = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  return { favorites, toggle, isFavorite };
}
