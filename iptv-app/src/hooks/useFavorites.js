import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const LS_KEY = 'iptv_favorites';

// ── localStorage helpers ──
function lsLoad() {
  try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
  catch { return new Set(); }
}
function lsSave(set) {
  localStorage.setItem(LS_KEY, JSON.stringify([...set]));
}

// ── Supabase helpers ──
async function sbLoad(userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('channel_id')
    .eq('user_id', userId);
  if (error) throw error;
  return new Set(data.map((r) => r.channel_id));
}

async function sbAdd(userId, channelId) {
  await supabase.from('favorites').insert({ user_id: userId, channel_id: channelId });
}

async function sbRemove(userId, channelId) {
  await supabase.from('favorites').delete()
    .eq('user_id', userId).eq('channel_id', channelId);
}

// ── Hook ──
export function useFavorites(user) {
  const [favorites,  setFavorites]  = useState(new Set());
  const [favLoading, setFavLoading] = useState(false);

  // Load on user change
  useEffect(() => {
    if (user) {
      setFavLoading(true);
      sbLoad(user.id)
        .then((set) => setFavorites(set))
        .catch(() => setFavorites(lsLoad()))
        .finally(() => setFavLoading(false));
    } else {
      setFavorites(lsLoad());
    }
  }, [user?.id]);

  const toggle = useCallback(async (channelId) => {
    const inFav = favorites.has(channelId);

    // Optimistic update
    setFavorites((prev) => {
      const next = new Set(prev);
      if (inFav) next.delete(channelId);
      else next.add(channelId);
      if (!user) lsSave(next);
      return next;
    });

    if (user) {
      try {
        if (inFav) await sbRemove(user.id, channelId);
        else       await sbAdd(user.id, channelId);
      } catch {
        // Rollback on error
        setFavorites((prev) => {
          const next = new Set(prev);
          if (inFav) next.add(channelId);
          else next.delete(channelId);
          return next;
        });
      }
    }
  }, [favorites, user]);

  const isFavorite = useCallback((id) => favorites.has(id), [favorites]);

  return { favorites, toggle, isFavorite, favLoading };
}
