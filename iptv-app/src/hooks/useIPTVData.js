import { useState, useEffect } from 'react';
import { fetchJSON, URLS } from '../utils/api';

const CACHE_KEY = 'iptv_data_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useIPTVData() {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Try cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, data } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            if (!cancelled) {
              setChannels(data.channels);
              setCategories(data.categories);
              setCountries(data.countries);
              setLoading(false);
            }
            return;
          }
        }

        setProgress(10);

        // Fetch all in parallel
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

        // Build lookup maps
        const blockedIds = new Set(rawBlocklist.map((b) => b.channel));

        const logoMap = {};
        for (const l of rawLogos) {
          if (l.channel && l.url) logoMap[l.channel] = l.url;
        }

        const streamMap = {};
        for (const s of rawStreams) {
          if (!s.channel) continue;
          if (!streamMap[s.channel]) streamMap[s.channel] = [];
          streamMap[s.channel].push(s);
        }

        // Merge
        const merged = [];
        for (const ch of rawChannels) {
          if (blockedIds.has(ch.id)) continue;
          const streams = streamMap[ch.id] || [];
          if (streams.length === 0) continue;

          // Sort streams: prefer higher resolution
          streams.sort((a, b) => {
            const resA = parseInt(a.height) || 0;
            const resB = parseInt(b.height) || 0;
            return resB - resA;
          });

          const bestStream = streams[0];
          const quality = bestStream.height
            ? `${bestStream.height}p`
            : bestStream.width
            ? `${bestStream.width}w`
            : null;

          merged.push({
            id: ch.id,
            name: ch.name,
            country: ch.country,
            languages: ch.languages || [],
            categories: ch.categories || [],
            logo: logoMap[ch.id] || ch.logo || null,
            streams: streams.map((s) => s.url),
            quality,
            website: ch.website || null,
            is_nsfw: ch.is_nsfw || false,
          });
        }

        // Sort alphabetically
        merged.sort((a, b) => a.name.localeCompare(b.name));

        // Extract unique countries
        const countrySet = new Set(merged.map((c) => c.country).filter(Boolean));
        const sortedCountries = [...countrySet].sort();

        // Category map: id -> name
        const catMap = {};
        for (const cat of rawCategories) {
          catMap[cat.id] = cat.name;
        }

        // Extract unique categories that actually appear
        const catSet = new Set(merged.flatMap((c) => c.categories));
        const activeCats = [...catSet]
          .map((id) => ({ id, name: catMap[id] || id }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setProgress(95);

        const result = {
          channels: merged,
          categories: activeCats,
          countries: sortedCountries,
        };

        // Cache
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data: result })
        );

        if (!cancelled) {
          setChannels(result.channels);
          setCategories(result.categories);
          setCountries(result.countries);
          setLoading(false);
          setProgress(100);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { channels, categories, countries, loading, error, progress };
}
