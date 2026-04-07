import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchJSON, URLS } from '../utils/api';

const RAW_KEY  = 'iptv_raw_v2';
const CAT_KEY  = (id) => `iptv_cat_v2_${id}`;
const TTL      = 60 * 60 * 1000; // 1h

// ── helpers ──────────────────────────────────────────────
function readSession(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}
function writeSession(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function buildChannel(ch, streamMap, logoMap) {
  const streams = (streamMap[ch.id] || []).slice().sort((a, b) => {
    return (parseInt(b.height) || 0) - (parseInt(a.height) || 0);
  });
  if (streams.length === 0) return null;
  const best = streams[0];
  return {
    id:         ch.id,
    name:       ch.name,
    country:    ch.country,
    languages:  ch.languages || [],
    categories: ch.categories || [],
    logo:       logoMap[ch.id] || ch.logo || null,
    streams:    streams.map((s) => s.url),
    quality:    best.height ? `${best.height}p` : best.width ? `${best.width}w` : null,
    website:    ch.website || null,
  };
}

function processCategory(catId, raw) {
  const { channels, streamMap, logoMap, blockedIds } = raw;
  const result = [];
  for (const ch of channels) {
    if (blockedIds.has(ch.id)) continue;
    if (catId !== '__all__' && !ch.categories.includes(catId)) continue;
    const built = buildChannel(ch, streamMap, logoMap);
    if (built) result.push(built);
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// Process IL (country) + sports as the initial set
function processInitial(raw) {
  const { channels, streamMap, logoMap, blockedIds } = raw;
  const result = [];
  for (const ch of channels) {
    if (blockedIds.has(ch.id)) continue;
    const isIL      = ch.country === 'IL';
    const isSports  = ch.categories.includes('sports');
    if (!isIL && !isSports) continue;
    const built = buildChannel(ch, streamMap, logoMap);
    if (built) result.push(built);
  }
  result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

// ── hook ────────────────────────────────────────────────
export function useIPTVData() {
  const rawRef = useRef(null);

  const [channels,        setChannels]        = useState([]);
  const [categories,      setCategories]      = useState([]);
  const [countries,       setCountries]       = useState([]);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [error,           setError]           = useState(null);
  const [progress,        setProgress]        = useState(0);

  // ── Initial fetch ──
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1. Try raw cache
        let raw = null;
        const cached = readSession(RAW_KEY);
        if (cached && Date.now() - cached.ts < TTL) {
          raw = cached.data;
        } else {
          setProgress(5);
          const [rawChannels, rawStreams, rawLogos, rawCategories, rawBlocklist] =
            await Promise.all([
              fetchJSON(URLS.channels),
              fetchJSON(URLS.streams),
              fetchJSON(URLS.logos),
              fetchJSON(URLS.categories),
              fetchJSON(URLS.blocklist),
            ]);
          if (cancelled) return;
          setProgress(65);

          const blockedIds = new Set(rawBlocklist.map((b) => b.channel));

          const logoMap = {};
          for (const l of rawLogos) if (l.channel && l.url) logoMap[l.channel] = l.url;

          const streamMap = {};
          for (const s of rawStreams) {
            if (!s.channel) continue;
            if (!streamMap[s.channel]) streamMap[s.channel] = [];
            streamMap[s.channel].push(s);
          }

          // Category list
          const catMap = {};
          for (const c of rawCategories) catMap[c.id] = c.name;
          const catSet = new Set(rawChannels.flatMap((c) => c.categories || []));
          const activeCats = [...catSet]
            .map((id) => ({ id, name: catMap[id] || id }))
            .sort((a, b) => a.name.localeCompare(b.name));

          // Countries
          const countrySet = new Set(rawChannels.map((c) => c.country).filter(Boolean));
          const sortedCountries = [...countrySet].sort();

          raw = {
            channels:    rawChannels,
            streamMap,
            logoMap,
            blockedIds,
            categories:  activeCats,
            countries:   sortedCountries,
          };

          writeSession(RAW_KEY, { ts: Date.now(), data: raw });
          setProgress(80);
        }

        rawRef.current = raw;

        // 2. Process initial set (sports + IL) — check session cache first
        let initial = readSession(CAT_KEY('__initial__'));
        if (!initial) {
          initial = processInitial(raw);
          writeSession(CAT_KEY('__initial__'), initial);
        }

        setProgress(95);

        if (!cancelled) {
          setChannels(initial);
          setCategories(raw.categories);
          setCountries(raw.countries);
          setInitialLoading(false);
          setProgress(100);
        }
      } catch (e) {
        if (!cancelled) { setError(e.message); setInitialLoading(false); }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ── Load a category on demand ──
  const loadCategory = useCallback((catId, favoriteIds = []) => {
    const raw = rawRef.current;
    if (!raw) return;

    // Initial pseudo-tab: sports+IL
    if (catId === '__initial__') {
      let ch = readSession(CAT_KEY('__initial__'));
      if (!ch) { ch = processInitial(raw); writeSession(CAT_KEY('__initial__'), ch); }
      setChannels(ch);
      return;
    }

    // Favorites: filter currently accumulated channels + load all if missing ids
    if (catId === '__fav__') {
      const favSet = new Set(favoriteIds);
      // Process all to guarantee we find every favorited channel
      let all = readSession(CAT_KEY('__all__'));
      if (!all) { all = processCategory('__all__', raw); writeSession(CAT_KEY('__all__'), all); }
      setChannels(all.filter((c) => favSet.has(c.id)));
      return;
    }

    // All channels
    if (catId === '__all__') {
      let cached = readSession(CAT_KEY('__all__'));
      if (cached) { setChannels(cached); return; }
      setCategoryLoading(true);
      setTimeout(() => {
        const result = processCategory('__all__', raw);
        writeSession(CAT_KEY('__all__'), result);
        setChannels(result);
        setCategoryLoading(false);
      }, 0);
      return;
    }

    // Normal category
    const cacheKey = CAT_KEY(catId);
    const cached = readSession(cacheKey);
    if (cached) { setChannels(cached); return; }

    setCategoryLoading(true);
    setTimeout(() => {
      const result = processCategory(catId, raw);
      writeSession(cacheKey, result);
      setChannels(result);
      setCategoryLoading(false);
    }, 0);
  }, []);

  return {
    channels,
    categories,
    countries,
    initialLoading,
    categoryLoading,
    error,
    progress,
    loadCategory,
  };
}
