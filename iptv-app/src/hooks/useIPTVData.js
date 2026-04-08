import { useState, useEffect } from 'react';
import { fetchJSON, URLS } from '../utils/api';

const CACHE_KEY = 'iptv_all_v3';
const TTL = 60 * 60 * 1000; // 1h

function readSession(key) {
  try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; }
}
function writeSession(key, val) {
  try { sessionStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useIPTVData() {
  const [allChannels, setAllChannels] = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [countries,   setCountries]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [progress,    setProgress]    = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Try cache
        const cached = readSession(CACHE_KEY);
        if (cached && Date.now() - cached.ts < TTL) {
          if (!cancelled) {
            setAllChannels(cached.data.channels);
            setCategories(cached.data.categories);
            setCountries(cached.data.countries);
            setLoading(false);
          }
          return;
        }

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
        setProgress(70);

        const blockedIds = new Set(rawBlocklist.map(b => b.channel));

        const logoMap = {};
        for (const l of rawLogos) if (l.channel && l.url) logoMap[l.channel] = l.url;

        const streamMap = {};
        for (const s of rawStreams) {
          if (!s.channel) continue;
          if (!streamMap[s.channel]) streamMap[s.channel] = [];
          streamMap[s.channel].push(s);
        }

        const catMap = {};
        for (const c of rawCategories) catMap[c.id] = c.name;

        // Build all channels — no category filtering
        const merged = [];
        for (const ch of rawChannels) {
          if (blockedIds.has(ch.id)) continue;
          const streams = (streamMap[ch.id] || []).slice().sort(
            (a, b) => (parseInt(b.height) || 0) - (parseInt(a.height) || 0)
          );
          if (!streams.length) continue;

          const best = streams[0];
          merged.push({
            id:         ch.id,
            name:       ch.name,
            country:    ch.country || '',
            languages:  ch.languages || [],
            categories: ch.categories || [],
            logo:       logoMap[ch.id] || ch.logo || null,
            streams:    streams.map(s => s.url),
            quality:    best.height ? `${best.height}p`
                      : best.width  ? `${best.width}w`
                      : null,
            website:    ch.website || null,
          });
        }

        merged.sort((a, b) => a.name.localeCompare(b.name));

        const catSet = new Set(merged.flatMap(c => c.categories));
        const activeCats = [...catSet]
          .map(id => ({ id, name: catMap[id] || id }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const countrySet = new Set(merged.map(c => c.country).filter(Boolean));
        const sortedCountries = [...countrySet].sort();

        setProgress(95);

        const result = { channels: merged, categories: activeCats, countries: sortedCountries };
        writeSession(CACHE_KEY, { ts: Date.now(), data: result });

        if (!cancelled) {
          setAllChannels(result.channels);
          setCategories(result.categories);
          setCountries(result.countries);
          setLoading(false);
          setProgress(100);
        }
      } catch (e) {
        if (!cancelled) { setError(e.message); setLoading(false); }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { allChannels, categories, countries, loading, error, progress };
}
