const BASE = 'https://iptv-org.github.io/api';

export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export const URLS = {
  channels:   `${BASE}/channels.json`,
  streams:    `${BASE}/streams.json`,
  logos:      `${BASE}/logos.json`,
  guides:     `${BASE}/guides.json`,
  categories: `${BASE}/categories.json`,
  blocklist:  `${BASE}/blocklist.json`,
};
